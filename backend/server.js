require('dotenv').config();
const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const FoodItem = require('./models/FoodItem');
const Addon = require('./models/Addon');
const Restaurant = require("./models/Restaurant");
const Cart = require('./models/Cart');
const Favorite = require('./models/Favourite');
const { Types: { ObjectId } } = mongoose;

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { dbName: "delivery_app" })
    .then(() => console.log("✅ Mongo connected"))
    .catch(console.error);



const signAccess = (user) =>
    jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: "30m" });

const signRefresh = (user) =>
    jwt.sign({ sub: user._id.toString() }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });



app.get("/mealDetails/:id", async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Id', id);
        const meal = await FoodItem.findById(req.params.id).populate("restaurantId").populate("addons").lean();

        // console.log("Meal: ", meal);

        if (!meal) {
            return res.status(404).json({ message: "Meal not found" });
        }

        res.status(200).json(meal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});



app.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role = "customer" } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email & password required" });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: "Email already in use" });

        const user = new User({ name, email, role });
        await user.setPassword(password);
        await user.save();

        const access = signAccess(user);
        const refresh = signRefresh(user);
        user.refreshTokens.push(refresh);
        await user.save();

        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, access, refresh });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const access = signAccess(user);
        const refresh = signRefresh(user);
        await User.updateOne({ _id: user._id }, { $push: { refreshTokens: refresh } });

        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, access, refresh });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/refresh", async (req, res) => {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: "Missing refresh token" });

    try {
        const payload = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload.sub);
        if (!user || !user.refreshTokens.includes(refresh)) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const access = signAccess(user);
        res.json({ access });
    } catch {
        res.status(401).json({ error: "Expired or invalid refresh" });
    }
});

// --------- LOGOUT ----------
app.post("/logout", async (req, res) => {
    const { refresh } = req.body;
    if (refresh) {
        try {
            const { sub } = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET);
            await User.updateOne({ _id: sub }, { $pull: { refreshTokens: refresh } });
        } catch { }
    }
    res.json({ ok: true });
});


app.get("/cart", async (req, res) => {
    try {
        const userId = req.query.userId; // e.g. /cart?userId=652a...
        if (!userId) return res.status(400).json({ error: "userId is required (query)" });

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = await Cart.create({ userId, items: [] });
        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Add item
app.post("/cart/items", async (req, res) => {
    try {
        const { userId, foodId, quantity = 1, addons = [], notes } = req.body;
        if (!userId || !foodId) return res.status(400).json({ error: "userId and foodId are required" });

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $push: { items: { foodId, quantity, addons, notes: notes || undefined } } },
            { upsert: true, new: true }
        );
        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update quantity
app.patch("/cart/items/:itemId/quantity", async (req, res) => {
    try {
        const { userId, quantity } = req.body;
        const { itemId } = req.params;
        if (!userId || !Number.isFinite(quantity) || quantity < 1) {
            return res.status(400).json({ error: "userId and quantity >= 1 are required" });
        }

        const cart = await Cart.findOneAndUpdate(
            { userId, "items._id": itemId },
            { $set: { "items.$.quantity": quantity } },
            { new: true }
        );
        if (!cart) return res.status(404).json({ error: "Cart or item not found" });
        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put("/cart/items/:itemId/addons", async (req, res) => {
    try {
        const { userId, addons = [] } = req.body;
        const { itemId } = req.params;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const cart = await Cart.findOneAndUpdate(
            { userId, "items._id": itemId },
            { $set: { "items.$.addons": addons } },
            { new: true }
        );
        if (!cart) return res.status(404).json({ error: "Cart or item not found" });
        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete("/cart/items/:itemId", async (req, res) => {
    try {
        const { userId } = req.body;
        const { itemId } = req.params;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        cart.items = cart.items.filter(i => String(i._id) !== String(itemId));
        await cart.recalculateTotals();
        await cart.save();

        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }

});

const toId = (id) => new ObjectId(String(id));
function validId(id) { return ObjectId.isValid(String(id)); }

app.post('/api/favorites/add', async (req, res) => {
    try {
        const { userId, foodId } = req.body || {};
        // console.log('ADD req.body:', req.body);
        // if (!validId(userId) || !validId(foodId)) {
        //     console.log('ADD invalid ids');
        //     return res.status(400).json({ error: 'Invalid userId or foodId' });
        // }
        const result = await Favorite.updateOne(
            { userId: toId(userId), foodId: toId(foodId) },
            { $setOnInsert: { userId: toId(userId), foodId: toId(foodId) } },
            { upsert: true }
        );
        // console.log('ADD result:', result); // { acknowledged, matchedCount, modifiedCount, upsertedId }
        return res.json({ ok: true, isFavorite: true, foodId: String(foodId) });
    } catch (e) {
        console.error('ADD error:', e);
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/favorites/list', async (req, res) => {
    try {
        const { userId } = req.body || {};
        // console.log('LIST req.body:', req.body);
        // if (!validId(userId)) return res.status(400).json({ error: 'Invalid userId' });
        const foodIds = await Favorite.find({ userId: toId(userId) }).distinct('foodId');
        return res.json({ foodIds: foodIds.map(String) });
    } catch (e) {
        console.error('LIST error:', e);
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/favorites/remove', async (req, res) => {
    try {
        const { userId, foodId } = req.body || {};
        // console.log('REMOVE req.body:', req.body);
        if (!validId(userId) || !validId(foodId)) {
            return res.status(400).json({ error: 'Invalid userId or foodId' });
        }
        const result = await Favorite.deleteOne({ userId: toId(userId), foodId: toId(foodId) });
        // console.log('REMOVE result:', result); // { deletedCount }
        return res.json({ ok: true, isFavorite: false, foodId: String(foodId) });
    } catch (e) {
        console.error('REMOVE error:', e);
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/favorites/toggle', async (req, res) => {
    const { userId, foodId } = req.body || {};
    if (!validId(userId) || !validId(foodId)) {
        return res.status(400).json({ error: 'Invalid userId or foodId' });
    }
    const existing = await Favorite.findOne({ userId, foodId });
    if (existing) {
        await existing.deleteOne();
        return res.json({ ok: true, isFavorite: false, foodId: String(foodId) });
    }
    await Favorite.create({ userId, foodId });
    res.json({ ok: true, isFavorite: true, foodId: String(foodId) });
});


// Clear cart
app.delete("/cart/clear", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId is required" });

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { new: true, upsert: true }
        );
        res.json(cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express backend 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
