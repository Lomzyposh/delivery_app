// models/Cart.js
const mongoose = require("mongoose");
const autopopulate = require("mongoose-autopopulate"); // npm i mongoose-autopopulate

const FoodItem = require("./FoodItem");
const AddOn = require("./Addon");

const { Schema, Types } = mongoose;

const AddonSubSchema = new Schema(
    {
        addOnId: {
            type: Schema.Types.ObjectId,
            ref: "AddOn",
            autopopulate: { select: "name price" },
            required: false,
        },
        // snapshot cache (optional, will be refreshed from DB in compute)
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

// ---------- JSON shape / virtuals ----------
CartSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        // keep _id, but ensure lean numbers
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

// ---------- Helpers ----------
async function computeItemTotal(item) {
    // ensure ObjectId types
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
        const price = idStr && priceById.has(idStr) ? priceById.get(idStr) : Number(a?.price || 0);
        const name = idStr && nameById.has(idStr) ? nameById.get(idStr) : a?.name;

        addonsSum += Number(price || 0);

        // keep original addOnId (as ObjectId or populated doc), refresh snapshot fields
        return { ...a, price, name };
    });

    const line = (Number(food.price || 0) + addonsSum) * Math.max(1, Number(item.quantity) || 1);
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

// ---------- Recalc hooks ----------
CartSchema.methods.recalculateTotals = async function () {
    await computeCartTotals(this);
};


// Recompute before save so totals are always fresh
CartSchema.pre("save", async function (next) {
    try {
        await computeCartTotals(this);
        next();
    } catch (err) {
        next(err);
    }
});

// After findOneAndUpdate, recompute + persist if items/subtotal changed
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

// ---------- Autopopulate plugin ----------
CartItemSchema.plugin(autopopulate);
AddonSubSchema.plugin(autopopulate);
CartSchema.plugin(autopopulate);

// ---------- Convenience statics ----------
CartSchema.statics.findOrCreateForUser = async function (userId) {
    const uid = new Types.ObjectId(String(userId));
    let cart = await this.findOne({ userId: uid });
    if (!cart) cart = await this.create({ userId: uid, items: [], subtotal: 0 });
    return cart;
};

CartSchema.statics.populateCart = function (query) {
    // Use this if you don’t want the plugin or want explicit control
    return query
        .populate({ path: "items.foodId", select: "name imageUrl price restaurantName slug" })
        .populate({ path: "items.addons.addOnId", select: "name price" });
};


module.exports = mongoose.model("Cart", CartSchema);
