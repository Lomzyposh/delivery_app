// db.js
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");
const bcrypt = require("bcryptjs");

// ---------------- AUTH ----------------
async function signup({ name, email, password }) {
  const exists = await User.findOne({ email });
  if (exists) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid email or password");

  return user; // return the doc, your route can issue JWT etc.
}

// ---------------- RESTAURANTS ----------------
async function getAllRestaurants() {
  return Restaurant.find().sort({ isFeatured: -1, "rating.average": -1 });
}

async function getRestaurantById(id) {
  return Restaurant.findById(id);
}

// ---------------- FOOD ITEMS ----------------
async function getFoodItemsByRestaurant(restaurantId) {
  return FoodItem.find({ restaurantId, isAvailable: true }).sort({ name: 1 });
}

async function searchFoodItems(query) {
  const filter = query ? { name: new RegExp(query, "i") } : {};
  return FoodItem.find(filter).populate("restaurantId", "name logo rating");
}

// ---------------- EXPORT ----------------
module.exports = {
  signup,
  login,
  getAllRestaurants,
  getRestaurantById,
  getFoodItemsByRestaurant,
  searchFoodItems,
};