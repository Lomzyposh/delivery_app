const express = require("express");
const cors = require("cors");
const User = require("./models/User");

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

// --------- REFRESH ----------
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


app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express backend 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
