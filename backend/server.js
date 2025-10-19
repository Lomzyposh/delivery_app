require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const FoodItem = require('./models/FoodItem');
const Addon = require('./models/Addon');
const Restaurant = require("./models/Restaurant");
const Cart = require('./models/Cart');
const Favorite = require('./models/Favourite');
const Code = require('./models/Code');
const { Types: { ObjectId } } = mongoose;

const LIFESPAN_MIN = 15;         
const MAX_ATTEMPTS = 5;
const RESET_WINDOW_MIN = 15;


async function verifyResetCode(email, code, purpose = 'forgot') {
    const normalized = String(email || '').trim().toLowerCase();
    const codeStr = String(code || '').trim();
    const now = new Date();

    if (!normalized || !codeStr) {
        return { success: false, message: 'Email and code are required.' };
    }
    if (!/^\d{6}$/.test(codeStr)) {
        return { success: false, message: 'Invalid code format.' };
    }

    // Get the most recent active code
    const doc = await Code.findOne({ email: normalized, purpose, used: false })
        .sort({ updatedAt: -1 });

    if (!doc) {
        return { success: false, message: 'Invalid or expired code.' };
    }
    if (doc.expiresAt <= now) {
        return { success: false, message: 'Code expired. Request a new one.' };
    }
    if ((doc.attempts ?? 0) >= MAX_ATTEMPTS) {
        return { success: false, message: 'Too many attempts. Request a new code.' };
    }

    // Mismatch → count attempt
    if (doc.code !== codeStr) {
        await Code.updateOne({ _id: doc._id }, { $inc: { attempts: 1 } });
        const left = Math.max(0, MAX_ATTEMPTS - ((doc.attempts ?? 0) + 1));
        return {
            success: false,
            message: left ? `Incorrect code. ${left} attempt(s) left.` : 'Too many attempts. Request a new code.',
        };
    }

    // ✅ Match: mark this code used
    await Code.updateOne({ _id: doc._id }, { $set: { used: true, usedAt: now } });

    // ✅ Open a reset window on the user (no JWT). You need a field on User for this.
    const resetAllowedUntil = new Date(Date.now() + RESET_WINDOW_MIN * 60 * 1000);
    await User.updateOne(
        { email: normalized },
        { $set: { resetAllowedUntil } },
        { upsert: false }
    );

    return {
        success: true,
        message: 'Code verified. You can now reset your password.',
        resetWindowMinutes: RESET_WINDOW_MIN,
        resetAllowedUntil,
    };
}


async function performPasswordReset(email, newPassword) {
    const normalized = String(email || '').trim().toLowerCase();
    const now = new Date();

    if (!normalized || !newPassword) {
        return { success: false, message: 'Email and new password are required.' };
    }
    if (newPassword.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters.' };
    }

    const user = await User.findOne({ email: normalized });
    if (!user) return { success: false, message: 'User not found.' };

    // ✅ Only allow if a recent verify opened the reset window
    if (!user.resetAllowedUntil || user.resetAllowedUntil <= now) {
        return { success: false, message: 'Reset window not active or expired. Verify your code again.' };
    }


    await user.setPassword(newPassword);

    user.resetAllowedUntil = null;

    await user.save();

    await Code.updateMany(
        { email: normalized, purpose: 'forgot', used: false },
        { $set: { used: true, usedAt: now } }
    );

    return { success: true, message: 'Password reset successfully.' };
}




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

async function processMail(to, subject, message) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `FoodHut <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: message,
        });

        return { success: true, message: 'Reset code sent.' };
    } catch (err) {
        console.error('Email sending error:', err?.response || err);
        return {
            success: false,
            message: 'Email failed to send. Please try again.',
            error: err?.message,
        };
    }
}


app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const normalized = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalized });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found.' });
        }

        // Generate a new 6-digit code and expiration time
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Replace any old code doc for this user
        await Code.deleteMany({ email: normalized, purpose: 'forgot' });

        await Code.create({
            email: normalized,
            purpose: 'forgot',
            code,
            expiresAt,
            used: false,
            attempts: 0,
        });

        // Send via your mailer
        const subject = 'Your Password Reset Code';
        const message = `
      <h2>Password Reset Request</h2>
      <p>Your password reset code is:</p>
      <h1 style="color:#1a73e8; letter-spacing:2px;">${code}</h1>
      <p>This code will expire in 15 minutes.</p>
      <p>— Food Hut Team</p>
    `;

        const mailSent = await processMail(normalized, subject, message);
        if (!mailSent?.success) {
            return res.status(500).json({ success: false, message: 'Failed to send email.' });
        }

        return res.status(200).json({
            success: true,
            message: 'Reset code sent successfully.',
            expiresInMinutes: 15,
            // devCode: code, // Uncomment only for testing
        });
    } catch (err) {
        console.error('forgot-password error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});


app.post('/api/verify-reset-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code are required.' });
        }
        if (!/^\d{6}$/.test(String(code))) {
            return res.status(400).json({ success: false, message: 'Invalid code format.' });
        }

        const result = await verifyResetCode(email, String(code), 'forgot');
        if (!result.success) return res.status(400).json(result);

        return res.status(200).json(result);
    } catch (err) {
        console.error('verify-reset-code error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const result = await performPasswordReset(email, newPassword);
        if (!result.success) return res.status(400).json(result);

        return res.status(200).json(result);
    } catch (err) {
        console.error('reset-password error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
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


app.get('/api/meals', async (req, res) => {
    console.log("req.query =>");

    try {
        const {
            category,
            q,
            restaurant,
            minPrice,
            maxPrice,
            sort = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 20,
        } = req.query;

        const andClauses = [];

        // Case-insensitive exact match helper
        const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const ciEq = (s) => new RegExp(`^${escape(s)}$`, 'i');

        // Category filter (supports string field, array field, or nested slug)
        if (category) {
            andClauses.push({
                $or: [
                    { category: ciEq(category) },
                    { categories: ciEq(category) },
                    { 'category.slug': ciEq(category) },
                ]
            });
        }

        if (q && String(q).trim()) {
            const rx = new RegExp(String(q).trim(), 'i');
            andClauses.push({
                $or: [{ name: rx }, { title: rx }, { description: rx }]
            });
        }

        if (restaurant && ObjectId.isValid(restaurant)) {
            andClauses.push({ restaurantId: new ObjectId(restaurant) });
        }

        const priceClause = {};
        if (!Number.isNaN(Number(minPrice))) priceClause.$gte = Number(minPrice);
        if (!Number.isNaN(Number(maxPrice))) priceClause.$lte = Number(maxPrice);
        if (Object.keys(priceClause).length) {
            andClauses.push({ price: priceClause });
        }

        const filter = andClauses.length ? { $and: andClauses } : {};

        const sortMap = { price: 'price', createdAt: 'createdAt', name: 'name' };
        const sortKey = sortMap[sort] || 'createdAt';
        const sortDir = String(order).toLowerCase() === 'asc' ? 1 : -1;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * pageSize;

        const [meals, total] = await Promise.all([
            FoodItem.find(filter)
                .sort({ [sortKey]: sortDir })
                .skip(skip)
                .limit(pageSize)
                .populate({
                    path: 'restaurantId',
                    select: 'name address logo rating',
                })
                .lean(),
            FoodItem.countDocuments(filter),
        ]);

        res.json({
            meals,
            meta: {
                page: pageNum,
                pageSize,
                total,
                hasMore: skip + meals.length < total,
                sort: sortKey,
                order: sortDir === 1 ? 'asc' : 'desc',
                applied: {
                    category: category || null,
                    q: q || null,
                    restaurant: restaurant || null,
                    minPrice: minPrice ?? null,
                    maxPrice: maxPrice ?? null,
                },
            },
        });
    } catch (e) {
        console.error('GET /api/meals error:', e);
        res.status(500).json({ error: e.message || 'Server error' });
    }
});



app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express backend 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
