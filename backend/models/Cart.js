// models/Cart.js
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate");

const FoodItem = require("./FoodItem");
const AddOn = require("./Addon");

const { Schema, Types } = mongoose;

/* ---------- Subschemas ---------- */
const AddonSubSchema = new Schema(
    {
        addOnId: {
            type: Schema.Types.ObjectId,
            ref: "AddOn",
            autopopulate: { select: "name price" },
            required: false,
        },
        // snapshot cache (refreshed during compute)
        name: String,
        price: { type: Number, default: 0 },
    },
    { _id: true }
);

const CartItemSchema = new Schema(
    {
        foodId: {
            type: Schema.Types.ObjectId,
            ref: "FoodItem",
            required: true,
            autopopulate: { select: "name image price restaurantId" },
        },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        addons: { type: [AddonSubSchema], default: [] },
        notes: { type: String, trim: true },
        totalPrice: { type: Number, min: 0, default: 0 },
    },
    { _id: true }
);

const CartSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
            unique: true,
        },
        items: { type: [CartItemSchema], default: [] },
        subtotal: { type: Number, min: 0, default: 0 },
    },
    { timestamps: true, collection: "carts" }
);

/* ---------- JSON shape / virtuals ---------- */
CartSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        if (typeof ret.subtotal === "string") ret.subtotal = Number(ret.subtotal);
        if (Array.isArray(ret.items)) {
            for (const it of ret.items) {
                if (typeof it.totalPrice === "string") it.totalPrice = Number(it.totalPrice);
            }
        }
        return ret;
    },
});

CartSchema.virtual("itemsCount").get(function () {
    return (this.items || []).reduce((n, it) => n + (Number(it.quantity) || 0), 0);
});

/* ---------- Helpers: compute totals ---------- */
async function computeItemTotal(item) {
    const foodId = item.foodId?._id || item.foodId;
    const food = await FoodItem.findById(foodId).select("price name").lean();
    if (!food) throw new Error("FoodItem not found for cart item");

    // collect addon ids
    const addonIds = (item.addons || [])
        .map((a) => (a?.addOnId?._id || a?.addOnId))
        .filter(Boolean);

    let addonsFromDb = [];
    if (addonIds.length) {
        addonsFromDb = await AddOn.find({ _id: { $in: addonIds } })
            .select("name price")
            .lean();
    }

    const priceById = new Map(addonsFromDb.map((a) => [String(a._id), a.price]));
    const nameById = new Map(addonsFromDb.map((a) => [String(a._id), a.name]));

    let addonsSum = 0;
    item.addons = (item.addons || []).map((a) => {
        const idStr = a?.addOnId ? String(a.addOnId._id || a.addOnId) : null;
        const price =
            idStr && priceById.has(idStr) ? priceById.get(idStr) : Number(a?.price || 0);
        const name = idStr && nameById.has(idStr) ? nameById.get(idStr) : a?.name;

        addonsSum += Number(price || 0);
        return { ...a, price, name };
    });

    const line =
        (Number(food.price || 0) + addonsSum) * Math.max(1, Number(item.quantity) || 1);
    item.totalPrice = Math.max(0, Number(line.toFixed(2)));
}

async function computeCartTotals(cartDoc) {
    let subtotal = 0;
    for (const item of cartDoc.items || []) {
        await computeItemTotal(item);
        subtotal += Number(item.totalPrice || 0);
    }
    cartDoc.subtotal = Math.max(0, Number(subtotal.toFixed(2)));
}

/* ---------- Recalc hooks ---------- */
CartSchema.methods.recalculateTotals = async function () {
    await computeCartTotals(this);
};

CartSchema.pre("save", async function (next) {
    try {
        await computeCartTotals(this);
        next();
    } catch (err) {
        next(err);
    }
});

CartSchema.post("findOneAndUpdate", async function (doc) {
    if (!doc) return;
    try {
        await computeCartTotals(doc);
        if (doc.isModified("items") || doc.isModified("subtotal")) {
            await doc.save();
        }
    } catch (err) {
        console.error("Cart totals recompute failed:", err.message);
    }
});

/* ---------- Autopopulate ---------- */
CartItemSchema.plugin(autopopulate);
AddonSubSchema.plugin(autopopulate);
CartSchema.plugin(autopopulate);

/* ---------- Utility: compare add-on sets (order-insensitive) ---------- */
function canonicalAddonIds(addons) {
    // accept [{addOnId}, {_id}, {id}] and return sorted string ids
    const ids = (addons || [])
        .map((a) => a?.addOnId?._id || a?.addOnId || a?._id || a?.id)
        .filter(Boolean)
        .map((x) => String(x));
    ids.sort();
    return ids;
}
function sameAddonSet(a, b) {
    const A = canonicalAddonIds(a);
    const B = canonicalAddonIds(b);
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
}

/* ---------- Instance helpers to add/merge lines ---------- */
CartSchema.methods.findLineIndexByComposite = function (foodId, addons) {
    const idStr = String(foodId);
    const items = this.items || [];
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const fId = String(it.foodId?._id || it.foodId);
        if (fId !== idStr) continue;
        if (sameAddonSet(it.addons, addons)) return i; // only merge when add-on set matches
    }
    return -1;
};

CartSchema.methods.addItemSmart = async function ({
    foodId,
    quantity = 1,
    addons = [],
    notes,
}) {
    const q = Math.max(1, Number(quantity) || 1);

    // normalize payload to { addOnId }
    const normAddons = canonicalAddonIds(addons).map((id) => ({ addOnId: new Types.ObjectId(id) }));

    const idx = this.findLineIndexByComposite(foodId, normAddons);
    if (idx >= 0) {
        // merge with same add-on set
        this.items[idx].quantity = Math.max(1, Number(this.items[idx].quantity || 1) + q);
    } else {
        // create a NEW line for different add-ons
        this.items.push({
            foodId: new Types.ObjectId(String(foodId)),
            quantity: q,
            addons: normAddons,
            notes: notes ? String(notes) : undefined,
        });
    }

    await this.recalculateTotals();
    return this.save();
};

/* ---------- Convenience statics ---------- */
CartSchema.statics.findOrCreateForUser = async function (userId) {
    const uid = new Types.ObjectId(String(userId));
    let cart = await this.findOne({ userId: uid });
    if (!cart) cart = await this.create({ userId: uid, items: [], subtotal: 0 });
    return cart;
};

CartSchema.statics.populateCart = function (query) {
    return query
        .populate({ path: "items.foodId", select: "name image price restaurantId" })
        .populate({ path: "items.addons.addOnId", select: "name price" });
};

module.exports = mongoose.model("Cart", CartSchema);
