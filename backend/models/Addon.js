const mongoose = require("mongoose");

const AddOnSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "FoodItem", required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ["extras", "sides", "sauces", "drinks", "desserts"],
      default: "extras",
    },
  },
  { collection: "addons", timestamps: true }
);

// Prevent duplicates per foodId+name
AddOnSchema.index({ foodId: 1, name: 1 }, { unique: true });

module.exports =
  mongoose.models.AddOn || mongoose.model("AddOn", AddOnSchema);
