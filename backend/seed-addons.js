// seed-addons.js
// Usage: node seed-addons.js
require('dotenv').config();
const mongoose = require('mongoose');
const FoodItem = require('./models/FoodItem');
const Addon = require('./models/Addon');

const MONGO_URI = process.env.MONGO_URI;


// ---------- CONFIG: tweak freely ----------
const DEFAULT_ADDONS = {
    generic: [
        { name: 'Soft Drink (Can)', price: 400, category: 'drinks' },
        { name: 'Bottled Water', price: 300, category: 'drinks' },
        { name: 'Side Salad', price: 500, category: 'sides' },
    ],
    beef: [
        { name: 'Extra Beef Patty', price: 700, category: 'extras' },
        { name: 'Cheese Slice', price: 300, category: 'extras' },
        { name: 'Brown Gravy', price: 250, category: 'sauces' },
        { name: 'French Fries', price: 500, category: 'sides' },
    ],
    burger: [
        { name: 'Bacon Strip', price: 400, category: 'extras' },
        { name: 'Double Patty Upgrade', price: 900, category: 'extras' },
        { name: 'Spicy Mayo', price: 200, category: 'sauces' },
        { name: 'Onion Rings', price: 600, category: 'sides' },
    ],
    rice: [
        { name: 'Fried Plantain', price: 500, category: 'sides' },
        { name: 'Boiled Egg', price: 250, category: 'extras' },
        { name: 'Coleslaw', price: 400, category: 'sides' },
        { name: 'Pepper Sauce', price: 200, category: 'sauces' },
    ],
    pasta: [
        { name: 'Meatballs (2pcs)', price: 700, category: 'extras' },
        { name: 'Extra Parmesan', price: 300, category: 'extras' },
        { name: 'Garlic Bread', price: 500, category: 'sides' },
    ],
    pizza: [
        { name: 'Extra Cheese', price: 400, category: 'extras' },
        { name: 'Pepperoni Topping', price: 500, category: 'extras' },
        { name: 'Garlic Dip', price: 200, category: 'sauces' },
    ],
    salad: [
        { name: 'Grilled Chicken', price: 900, category: 'extras' },
        { name: 'Avocado', price: 500, category: 'extras' },
        { name: 'House Dressing', price: 200, category: 'sauces' },
    ],
    dessert: [
        { name: 'Vanilla Scoop', price: 400, category: 'desserts' },
        { name: 'Chocolate Sauce', price: 250, category: 'sauces' },
    ],
    sandwich_wrap: [
        { name: 'Extra Egg', price: 250, category: 'extras' },
        { name: 'Cheese Slice', price: 300, category: 'extras' },
        { name: 'Chipotle Mayo', price: 250, category: 'sauces' },
    ],
    middle_eastern: [
        { name: 'Extra Garlic Sauce', price: 250, category: 'sauces' },
        { name: 'Toasted Pita', price: 400, category: 'sides' },
        { name: 'Mint Lemonade', price: 450, category: 'drinks' },
    ],
    balkan_goulash: [
        { name: 'Garlic Bread', price: 400, category: 'sides' },
        { name: 'Extra Sauce Bowl', price: 300, category: 'sauces' },
        { name: 'Small Wine Glass', price: 800, category: 'drinks' },
    ],
    greek_moussaka: [
        { name: 'Extra Cheese', price: 300, category: 'extras' },
        { name: 'Greek Salad Bowl', price: 700, category: 'sides' },
        { name: 'Coke 50cl', price: 400, category: 'drinks' },
        { name: 'Garlic Bread', price: 500, category: 'sides' },
    ],
};

const KEYWORD_BUCKETS = [
    { test: /(moussaka)/i, bucket: 'greek_moussaka' },
    { test: /(fatteh|shawarma|kebab|falafel|pita|hummus)/i, bucket: 'middle_eastern' },
    { test: /(goulash)/i, bucket: 'balkan_goulash' },
    { test: /(burger|beef pie|beef)/i, bucket: 'beef' },
    { test: /(pizza)/i, bucket: 'pizza' },
    { test: /(spaghetti|pasta|penne|lasagna|fettuccine)/i, bucket: 'pasta' },
    { test: /(fried rice|jollof|rice|biryani)/i, bucket: 'rice' },
    { test: /(salad)/i, bucket: 'salad' },
    { test: /(sandwich|sub|wrap|roti john)/i, bucket: 'sandwich_wrap' },
    { test: /(cake|brownie|ice cream|pudding|dessert)/i, bucket: 'dessert' },
    // Fallbacks by category field:
    { test: (name, cat) => /beef/i.test(cat || ''), bucket: 'beef' },
];

function pickBucket(name, category) {
    for (const rule of KEYWORD_BUCKETS) {
        const ok = typeof rule.test === 'function' ? rule.test(name, category) : rule.test.test(name);
        if (ok) return rule.bucket;
    }
    return 'generic';
}

async function main() {
    await mongoose.connect(MONGO_URI, {
        autoIndex: true,
        dbName: 'delivery_app'
    });
    console.log('✅ Connected');

    const foods = await FoodItem.find({}, { name: 1, category: 1 }).lean();
    if (!foods.length) {
        console.log('No FoodItem documents found.');
        return;
    }
    console.log(`Found ${foods.length} food items.`);

    // Optional: remove existing addons for a clean re-seed
    // await AddOn.deleteMany({});

    const ops = [];
    for (const f of foods) {
        const bucket = pickBucket(f.name || '', f.category || '');
        const candidates = (DEFAULT_ADDONS[bucket] || []).concat(DEFAULT_ADDONS.generic);

        // Ensure at least 3 add-ons and remove duplicates by name
        const byName = new Map();
        for (const a of candidates) {
            if (!byName.has(a.name)) byName.set(a.name, a);
        }
        const selected = Array.from(byName.values()).slice(0, Math.max(3, Math.min(5, byName.size)));

        for (const addon of selected) {
            ops.push({
                updateOne: {
                    filter: { foodId: f._id, name: addon.name },
                    update: {
                        $setOnInsert: {
                            foodId: f._id,
                            name: addon.name,
                            price: addon.price,
                            category: addon.category
                        }
                    },
                    upsert: true
                }
            });
        }
    }

    // Bulk write in batches to avoid memory issues
    const chunkSize = 1000;
    let inserted = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
        const chunk = ops.slice(i, i + chunkSize);
        const res = await Addon.bulkWrite(chunk, { ordered: false });
        inserted += (res.upsertedCount || 0);
        console.log(`Processed ${i + chunk.length}/${ops.length} — upserts so far: ${inserted}`);
    }

    console.log(`🎉 Done. Upserted ~${inserted} add-ons across ${foods.length} foods.`);
}

main()
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    });
