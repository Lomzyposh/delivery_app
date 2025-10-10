// models/Cart.js
const mongoose = require("mongoose");

const FoodItem = require("./FoodItem"); 
const AddOn = require("./Addon");       

const CartItemSchema = new mongoose.Schema({
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodItem",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
    addons: [
        {
            addOnId: { type: mongoose.Schema.Types.ObjectId, ref: "AddOn" },
            name: String,   // optional cache
            price: Number,  // optional cache (we'll refresh it)
        },
    ],
    notes: { type: String, trim: true },
    // Total for THIS line: (food.price + sum(addon.price)) * quantity
    totalPrice: { type: Number, min: 0, default: 0 },
});

const CartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        items: [CartItemSchema],

        // Optional stored totals for the whole cart
        subtotal: { type: Number, min: 0, default: 0 },
        // If you plan taxes/discounts later, add fields and compute them here too
    },
    { timestamps: true, collection: "carts" }
);

CartSchema.index({ userId: 1 }, { unique: true });

async function computeItemTotal(item) {
    const food = await FoodItem.findById(item.foodId).select("price name").lean();
    if (!food) throw new Error("FoodItem not found for cart item");

    const addonIds = (item.addons || [])
        .map((a) => a?.addOnId)
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
        const _id = a?.addOnId ? String(a.addOnId) : null;
        const price = _id && priceById.has(_id) ? priceById.get(_id) : Number(a?.price || 0);
        const name = _id && nameById.has(_id) ? nameById.get(_id) : (a?.name || undefined);
        addonsSum += Number(price || 0);
        return { ...a, price, name };
    });

    const line = (Number(food.price || 0) + addonsSum) * Number(item.quantity || 1);
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

module.exports = mongoose.model("Cart", CartSchema);
