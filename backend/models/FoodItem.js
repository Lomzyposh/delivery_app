const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // reference to Restaurant collection
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String, // store URL or base64
      default: "",
    },
    category: {
      type: String,
      enum: ["Snacks", "Meals", "Drinks", "Desserts", "Others"],
      default: "Snacks",
    },
    ingredients: {
      type: [String], // array of strings
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // ⭐ Extras
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }, // number of ratings
    },
    tags: {
      type: [String], // e.g. ["spicy", "vegan", "local"]
      default: [],
    },
    prepTime: {
      type: Number, // in minutes (optional)
      default: 0,
    },
    discount: {
      type: Number, // percentage discount e.g. 10 for 10%
      default: 0,
    },
    isFeatured: {
      type: Boolean, // highlight in promotions
      default: false,
    },
  },
  { timestamps: true, collection: "fooditems" }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);
