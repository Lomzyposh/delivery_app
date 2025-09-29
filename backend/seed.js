require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'delivery_app'
  });
  console.log("✅ Connected");

  // 1) Create a restaurant
  const mamaCass = await Restaurant.create({
    name: "Mama Cass Eatery",
    description: "Authentic Nigerian meals and snacks.",
    address: { street: "12 Allen Avenue", city: "Ikeja", state: "Lagos", country: "Nigeria" },
    coords: { lat: 6.6018, lng: 3.3515 },
    openHours: [
      { day: "Monday", open: "08:00", close: "22:00" },
      { day: "Tuesday", open: "08:00", close: "22:00" },
    ],
    deliveryFee: { base: 500, perKm: 100 },
    minOrderValue: 1500,
    cuisines: ["Nigerian", "Snacks", "Grill"],
  });

  // 2) Create multiple food items **linked** to that restaurant
  await FoodItem.insertMany([
    {
      restaurantId: mamaCass._id,
      name: "Meat Pie",
      description: "Flaky pastry filled with spiced meat & veggies",
      price: 1200,
      category: "Snacks",
      ingredients: ["Flour", "Beef", "Carrot", "Onion"],
      tags: ["baked", "popular", "nigerian"],
      prepTime: 20,
    },
    {
      restaurantId: mamaCass._id,
      name: "Puff Puff",
      description: "Sweet, fluffy fried dough balls",
      price: 500,
      category: "Snacks",
      ingredients: ["Flour", "Yeast", "Sugar"],
      tags: ["sweet", "popular"],
      prepTime: 10,
    },
    {
      restaurantId: mamaCass._id,
      name: "Suya",
      description: "Spicy grilled beef skewers",
      price: 2000,
      category: "Meals",
      ingredients: ["Beef", "Yaji spice", "Onion"],
      tags: ["spicy", "grill"],
      prepTime: 15,
    },
  ]);

  console.log("🌱 Seeded restaurant + food items");
  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

run().catch(console.error);
