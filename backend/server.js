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
const { estimateDeliveryFee, isOpenNow, haversineKm } = require('../frontend/utils/restaurantHelpers');
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
    jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "30m" }
    );

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
        console.log("Access", access)
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


const asId = (v) => new mongoose.Types.ObjectId(String(v));

// compute total for one item
async function computeItemTotal(foodId, quantity, addons = []) {
    const food = await FoodItem.findById(foodId).lean();
    if (!food) throw new Error("Food item not found");
    const base = Number(food.price) || 0;

    const addonsTotal = (addons || []).reduce(
        (sum, a) => sum + (Number(a.price) || 0),
        0
    );
    return (base + addonsTotal) * Math.max(1, Number(quantity) || 1);
}

// helper to always return a populated cart
async function getPopulatedCart(userId) {
    return Cart.findOne({ userId: asId(userId) })
        .populate({
            path: "items.foodId",
            select: "name image price restaurantId",
        })
        .populate({
            path: "items.foodId.restaurantId",
            select: "name",
        })
        .populate({
            path: "items.addons.addOnId",
            select: "name price",
        })
        .lean();
}
/* ==================== CART ROUTES (updated) ==================== */
/* Helpers used only in this routes file */
const canonicalAddonIds = (addons = []) => {
    // Accept shapes: { addOnId }, {_id}, { id }, raw string/objectid
    const ids = addons
        .map(a => a?.addOnId?._id || a?.addOnId || a?._id || a?.id || a)
        .filter(Boolean)
        .map(x => String(x));
    ids.sort();
    return ids;
};
const sameAddonSet = (a = [], b = []) => {
    const A = canonicalAddonIds(a);
    const B = canonicalAddonIds(b);
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
};
const normalizeAddonsForStorage = (addons = []) =>
    canonicalAddonIds(addons).map(id => ({ addOnId: asId(id) }));

/* ---------------- GET /cart ---------------- */
app.get("/cart", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId is required (query)" });

        let cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) cart = await Cart.create({ userId: asId(userId), items: [], subtotal: 0 });

        const populated = await getPopulatedCart(userId);
        res.json(populated || cart);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ---------------- POST /cart/items ----------------
   Add item: MERGE only if (same foodId AND same add-on set AND same notes).
   Otherwise create a NEW line.
---------------------------------------------------- */
app.post("/cart/items", async (req, res) => {
    try {
        const { userId, foodId, quantity = 1, addons = [], notes } = req.body;
        if (!userId || !foodId)
            return res.status(400).json({ error: "userId and foodId are required" });

        let cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) cart = await Cart.create({ userId: asId(userId), items: [], subtotal: 0 });

        const normalizedAddons = normalizeAddonsForStorage(addons);

        // find an existing line with SAME composite (foodId + addons + notes)
        const existing = (cart.items || []).find(
            it =>
                String(it.foodId) === String(foodId) &&
                sameAddonSet(it.addons, normalizedAddons) &&
                String(it.notes || "") === String(notes || "")
        );

        if (existing) {
            const newQty = (Number(existing.quantity) || 1) + (Number(quantity) || 1);
            existing.quantity = Math.max(1, newQty);
            existing.totalPrice = await computeItemTotal(existing.foodId, existing.quantity, existing.addons);
        } else {
            const totalPrice = await computeItemTotal(foodId, quantity, normalizedAddons);
            cart.items.push({
                foodId: asId(foodId),
                quantity: Number(quantity) || 1,
                addons: normalizedAddons,   // snapshot (name/price) refreshed in compute
                notes,
                totalPrice,
            });
        }

        await cart.recalculateTotals();
        await cart.save();

        const populated = await getPopulatedCart(userId);
        res.json(populated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ---------------- PATCH /cart/items/:itemId/quantity ---------------- */
app.patch("/cart/items/:itemId/quantity", async (req, res) => {
    try {
        const { userId, quantity } = req.body;
        const { itemId } = req.params;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        const q = Math.max(0, Number(quantity) || 0);
        if (q <= 0) {
            item.deleteOne();
        } else {
            item.quantity = q;
            item.totalPrice = await computeItemTotal(item.foodId, q, item.addons);
        }

        await cart.recalculateTotals();
        await cart.save();

        const populated = await getPopulatedCart(userId);
        res.json(populated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ---------------- PUT /cart/items/:itemId/addons ----------------
   Change add-ons for a line:
   - If another line with SAME foodId AND SAME (new) add-on set AND SAME notes exists,
     MERGE quantities into that line and delete the current line.
   - Else just update this line’s add-ons and recompute.
------------------------------------------------------------------ */
app.put("/cart/items/:itemId/addons", async (req, res) => {
    try {
        const { userId, addons = [], notes } = req.body; // notes optional; if present, participates in merge
        const { itemId } = req.params;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        const normalizedAddons = normalizeAddonsForStorage(addons);
        const targetNotes = notes != null ? String(notes) : String(item.notes || "");

        // Find potential merge target
        const mergeInto = (cart.items || []).find(
            it =>
                it._id.toString() !== item._id.toString() &&
                String(it.foodId) === String(item.foodId) &&
                sameAddonSet(it.addons, normalizedAddons) &&
                String(it.notes || "") === targetNotes
        );

        if (mergeInto) {
            // merge qty into target
            mergeInto.quantity = Math.max(1, (Number(mergeInto.quantity) || 1) + (Number(item.quantity) || 1));
            mergeInto.totalPrice = await computeItemTotal(mergeInto.foodId, mergeInto.quantity, mergeInto.addons);
            // remove current line
            item.deleteOne();
        } else {
            // just update this line
            item.addons = normalizedAddons;
            if (notes != null) item.notes = targetNotes;
            item.totalPrice = await computeItemTotal(item.foodId, item.quantity, item.addons);
        }

        await cart.recalculateTotals();
        await cart.save();

        const populated = await getPopulatedCart(userId);
        res.json(populated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ---------------- DELETE /cart/items/:itemId ---------------- */
app.delete("/cart/items/:itemId", async (req, res) => {
    try {
        const { userId } = req.body;
        const { itemId } = req.params;
        if (!userId) return res.status(400).json({ error: "userId required" });

        const cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({ error: "Item not found" });

        item.deleteOne();
        await cart.recalculateTotals();
        await cart.save();

        const populated = await getPopulatedCart(userId);
        res.json(populated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ---------------- DELETE /cart/clear ---------------- */
app.delete("/cart/clear", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "userId required" });

        let cart = await Cart.findOne({ userId: asId(userId) });
        if (!cart) cart = await Cart.create({ userId: asId(userId), items: [], subtotal: 0 });

        cart.items = [];
        await cart.recalculateTotals();
        await cart.save();

        const populated = await getPopulatedCart(userId);
        res.json(populated);
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

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await Code.deleteMany({ email: normalized, purpose: 'forgot' });

        await Code.create({
            email: normalized,
            purpose: 'forgot',
            code,
            expiresAt,
            used: false,
            attempts: 0,
        });

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
        if (!result.success) return res.status(401).json({ success: false, message: result.message });

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




app.get('/api/meals', async (req, res) => {
    try {
        const meals = await FoodItem.find({})
            .populate({ path: 'restaurantId', select: 'name address logo rating' })
            .lean();

        res.json({ meals, total: meals.length });
    } catch (e) {
        console.error('GET /api/meals error:', e);
        res.status(500).json({ error: e.message || 'Server error' });
    }
});


app.get("/api/restaurants", async (req, res) => {
    try {
        const { q = "", featured } = req.query;
        const filter = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { cuisines: { $regex: q, $options: "i" } },
            ];
        }
        if (featured != null) filter.isFeatured = featured === "true";

        const items = await Restaurant.find(filter).sort({ isFeatured: -1, createdAt: -1 }).lean();
        return res.json({ items });
    } catch (e) {
        console.error("List restaurants failed:", e);
        return res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});

app.get("/api/restaurants/:id", async (req, res) => {
    try {
        const r = await Restaurant.findById(req.params.id).lean();
        if (!r) return res.status(404).json({ error: "Restaurant not found" });
        return res.json(r);
    } catch (e) {
        return res.status(400).json({ error: "Invalid restaurant id" });
    }
});

// GET /api/restaurants/:id/fooditems  (foods for a restaurant)
app.get("/api/restaurants/:id/fooditems", async (req, res) => {
    try {
        const { id } = req.params;
        const items = await FoodItem.find({ restaurantId: id, isAvailable: true })
            .sort({ isFeatured: -1, createdAt: -1 })
            .lean();
        return res.json({ items });
    } catch (e) {
        console.error("List foods failed:", e);
        return res.status(500).json({ error: "Failed to fetch foods" });
    }
});

app.post("/api/fooditems", async (req, res) => {
    try {
        // validate restaurant exists
        const { restaurantId } = req.body || {};
        if (!restaurantId) return res.status(400).json({ error: "restaurantId is required" });
        const exists = await Restaurant.exists({ _id: restaurantId });
        if (!exists) return res.status(404).json({ error: "Restaurant not found" });

        const doc = await FoodItem.create(req.body);
        return res.status(201).json(doc);
    } catch (e) {
        console.error("Create food failed:", e);
        return res.status(400).json({ error: e.message || "Invalid food data" });
    }
});



app.patch("/api/me", async (req, res) => {
    const { name, email } = req.body || {};
    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof email === "string") update.email = email.trim().toLowerCase();

    try {
        const me = await User.findById(req.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        if (update.name !== undefined) me.name = update.name;
        if (update.email !== undefined) me.email = update.email;

        await me.save();

        res.json({
            _id: me._id,
            name: me.name,
            email: me.email,
            role: me.role,
            createdAt: me.createdAt,
            updatedAt: me.updatedAt,
        });
    } catch (e) {
        if (e?.code === 11000 && e?.keyPattern?.email) {
            return res.status(400).json({ message: "Email is already in use" });
        }
        return res.status(400).json({ message: e.message || "Failed to update profile" });
    }
});

app.patch("/api/me/password", async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: "User not found" });

    const ok = await me.validatePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    await me.setPassword(newPassword);
    await me.save();

    res.json({ ok: true });
});



app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express backend 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
