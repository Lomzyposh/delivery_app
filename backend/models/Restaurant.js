const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    logo: String,
    bannerImage: String,
    phone: String,
    email: { type: String, lowercase: true },
    address: {
      street: String, city: String, state: String, country: String, postalCode: String,
    },
    coords: { lat: Number, lng: Number },
    openHours: [
      { day: String, open: String, close: String, isClosed: { type: Boolean, default: false } }
    ],
    deliveryFee: { base: { type: Number, default: 0 }, perKm: { type: Number, default: 0 } },
    minOrderValue: { type: Number, default: 0 },
    rating: { average: { type: Number, default: 0, min: 0, max: 5 }, count: { type: Number, default: 0 } },
    cuisines: [String],
    isOpen: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "restaurants" }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
