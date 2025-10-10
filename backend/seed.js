require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");
const fs = require("fs");
const path = require("path");

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'delivery_app'
  });
  console.log("✅ Connected");
  // const raw = fs.readFileSync(path.join(__dirname, "items.json"), "utf8");
  // const food = JSON.parse(raw);

  const raw = fs.readFileSync(path.join(__dirname, "restaurants.json"), "utf8");
  const restaurant = JSON.parse(raw);
  // // 1) Create a restaurant
  await Restaurant.insertMany(restaurant);

  // await FoodItem.insertMany(food);
  // console.log(food.length)
  console.log("🌱 Seeded restaurant + food items");
  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

run().catch(console.error);
