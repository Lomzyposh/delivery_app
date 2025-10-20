import dotenv from 'dotenv'
import mongoose from "mongoose";
dotenv.config();

import FoodItem from "./models/FoodItem.js";

mongoose.connect(process.env.MONGO_URI, {
    dbName: 'delivery_app'
});


const discounts = [15, 20, 25, 30];
const allItems = await FoodItem.find();

for (const item of allItems) {
    const randomDiscount = discounts[Math.floor(Math.random() * discounts.length)];
    item.discount = randomDiscount;
    await item.save();
}

console.log("✅ Discounts updated for all items!");

