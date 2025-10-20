// Please DONT RUN This
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// -------------------- CONFIG --------------------
const TOTAL_RESTAURANTS = 10;       
const MAX_ITEMS = 120;               
const CATEGORIES_WHITELIST = null;   // e.g. ["Dessert", "Beef", "Chicken"] or null for all
const PRICE_NGN = [500, 5000];
const PREP_TIME_MINMAX = [10, 45];  
const RATING_AVG_RANGE = [3.5, 5.0]; 
const RATING_COUNT_RANGE = [5, 1200];
const AVAILABILITY_TRUE_PROB = 0.88;
const NIGERIAN_CITIES = [
  { city: "Lagos", state: "Lagos" },
  { city: "Abuja", state: "FCT" },
  { city: "Port Harcourt", state: "Rivers" },
  { city: "Ibadan", state: "Oyo" },
  { city: "Benin City", state: "Edo" },
  { city: "Enugu", state: "Enugu" },
  { city: "Abeokuta", state: "Ogun" },
  { city: "Uyo", state: "Akwa Ibom" },
];
const BRAND_WORDS = ["Kitchen", "Grill", "Bistro", "Spot", "Hub", "Corner", "House", "Express"];
// ------------------------------------------------

// --- helpers ---
function newObjectId() {
  // 12-byte hex => 24 char string like Mongo ObjectId
  return crypto.randomBytes(12).toString("hex");
}
function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max, dp = 1) {
  const v = Math.random() * (max - min) + min;
  const m = Math.pow(10, dp);
  return Math.round(v * m) / m;
}
function chance(pTrue) {
  return Math.random() < pTrue;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function priceNGN([min, max]) {
  const step = 50;
  return Math.round(randBetween(min, max) / step) * step;
}

// fetch wrapper
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
  // Node 16/17:
  // const axios = require("axios"); return (await axios.get(url)).data;
}

// extract ingredients from a detail meal object
function extractIngredients(detail) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (detail[`strIngredient${i}`] || "").trim();
    const measure = (detail[`strMeasure${i}`] || "").trim();
    if (name) {
      ingredients.push(measure ? `${name} (${measure})` : name);
    }
  }
  return ingredients;
}

// naive tags based on category/name/area
function deriveTags({ strCategory, strMeal, strArea }) {
  const tags = [];
  if (/dessert|cake|sweet|pudding|pie|custard/i.test(strMeal) || /Dessert/i.test(strCategory)) {
    tags.push("sweet");
  }
  if (/spicy|pepper|peri|chili|chilli|curry|jollof/i.test(strMeal)) {
    tags.push("spicy");
  }
  if (/vegan|vegetarian|salad/i.test(strMeal)) {
    tags.push("veggie");
  }
  if (strArea) tags.push(strArea.toLowerCase());
  return Array.from(new Set(tags));
}

async function getAllCategories() {
  const { meals } = await fetchJson("https://www.themealdb.com/api/json/v1/1/list.php?c=list");
  const cats = (meals || []).map((c) => c.strCategory).filter(Boolean);
  return CATEGORIES_WHITELIST ? cats.filter((c) => CATEGORIES_WHITELIST.includes(c)) : cats;
}

async function getMealsForCategory(category) {
  // returns lightweight (id, name, thumb)
  const { meals } = await fetchJson(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(category)}`
  );
  return meals || [];
}

async function getMealDetail(idMeal) {
  const { meals } = await fetchJson(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`);
  return meals && meals[0] ? meals[0] : null;
}

function buildRestaurants(n) {
  const restaurants = [];
  for (let i = 0; i < n; i++) {
    const loc = pick(NIGERIAN_CITIES);
    const name = `${pick(["Naija", "City", "Royal", "Urban", "Savory", "Tasty", "Mama", "Chef"])} ${pick(BRAND_WORDS)} ${randBetween(1, 99)}`;
    restaurants.push({
      _id: newObjectId(), // Mongo-style
      name,
      address: {
        street: `${randBetween(1, 200)} ${pick([
          "Adeola",
          "Bourdillon",
          "Herbert Macaulay",
          "Awolowo",
          "Okpara",
          "Sapele",
          "Adetokunbo",
        ])} ${pick(["Street", "Avenue", "Road"])}`,
        city: loc.city,
        state: loc.state,
      },
      phone: `+23480${randBetween(10000000, 99999999)}`,
      isOpen: true,
    });
  }
  return restaurants;
}

async function main() {
  console.log("Fetching categories…");
  const categories = await getAllCategories();

  const restaurants = buildRestaurants(TOTAL_RESTAURANTS);
  const items = [];

  // collect meals across categories until MAX_ITEMS
  for (const cat of categories) {
    if (items.length >= MAX_ITEMS) break;

    console.log(`  • fetching meals for ${cat}`);
    const meals = await getMealsForCategory(cat);
    // shuffle
    const shuffled = meals.slice().sort(() => Math.random() - 0.5);

    for (const lite of shuffled) {
      if (items.length >= MAX_ITEMS) break;

      // fetch detail for ingredients + area + category (reliable)
      const detail = await getMealDetail(lite.idMeal);
      if (!detail) continue;

      // ----- build item in your schema -----
      const restaurant = pick(restaurants);
      const price = priceNGN(PRICE_NGN);
      const ratingAvg = randFloat(RATING_AVG_RANGE[0], RATING_AVG_RANGE[1], 1);
      const ratingCount = randBetween(RATING_COUNT_RANGE[0], RATING_COUNT_RANGE[1]);
      const prepTime = randBetween(PREP_TIME_MINMAX[0], PREP_TIME_MINMAX[1]);

      const ingredients = extractIngredients(detail);
      const tags = deriveTags(detail);

      items.push({
        restaurantId: restaurant._id,           
        name: detail.strMeal,                               
        description: (detail.strInstructions || "").trim() 
          ? detail.strInstructions.trim().split("\r\n").slice(0, 2).join(" ") // keep it short-ish
          : `Delicious ${detail.strCategory?.toLowerCase() || "dish"} prepared fresh.`,
        price,                                              // random NGN in range
        image: detail.strMealThumb || "",                   // real image URL
        category: detail.strCategory || cat,                // category (from API or fallback)
        ingredients,                                        // real ingredient list
        isAvailable: chance(AVAILABILITY_TRUE_PROB),
        tags,
        rating: { average: ratingAvg, count: ratingCount },
        prepTime,                                           // random minutes
      });
    }
  }

  // --- write files ---
  const outRestaurants = path.join(process.cwd(), "restaurants.json");
  const outItems = path.join(process.cwd(), "items.json");

  fs.writeFileSync(outRestaurants, JSON.stringify(restaurants, null, 2), "utf8");
  fs.writeFileSync(outItems, JSON.stringify(items, null, 2), "utf8");

  console.log(`\n✅ Generated ${restaurants.length} restaurants -> restaurants.json`);
  console.log(`✅ Generated ${items.length} items -> items.json`);
  console.log(`   Example item:`);
  console.log(items[0] || {});
}

main().catch((err) => {
  console.error("Failed to generate:", err);
  process.exit(1);
});
