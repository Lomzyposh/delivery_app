// models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
    foodId: { type: Schema.Types.ObjectId, ref: "FoodItem" },
    name: String,
    image: String,
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    addOns: [{ name: String, price: { type: Number, default: 0, min: 0 } }],
    totalPrice: { type: Number, default: 0, min: 0 },
});

const OrderSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        contact: { name: { type: String, required: true }, phone: { type: String, required: true } },
        shipping: {
            deliveryType: { type: String, enum: ["delivery", "pickup"], required: true },
            address: String,
            pickupStation: String,
            notes: String,
        },
        restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant" },
        items: { type: [OrderItemSchema], default: [] },
        amounts: {
            subtotal: { type: Number, default: 0 }, vat: { type: Number, default: 0 },
            deliveryFee: { type: Number, default: 0 }, total: { type: Number, default: 0 },
            currency: { type: String, default: "NGN" },
        },
        payment: {
            method: { type: String, enum: ["card", "transfer", "cod"], required: true },
            status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
            reference: String,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "preparing", "ready-for-pickup", "out-for-delivery", "completed", "cancelled"],
            default: "pending",
            index: true,
        },
    },
    { timestamps: true, collection: "orders" }
);

module.exports = mongoose.models.Order || mongoose.model("Order", OrderSchema);
