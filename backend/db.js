const Code = require('./models/Code');
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");
const FoodItem = require("./models/FoodItem");
const bcrypt = require("bcryptjs");

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

  return user;
}

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

async function setCode(email, code, purpose = 'forgot', minutes = 15) {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);
    const codeHash = await bcrypt.hash(code, 10);

    const updated = await Code.findOneAndUpdate(
      { email: email.toLowerCase(), purpose },
      {
        $set: {
          code: codeHash,
          expiresAt,
          used: false,
          attempts: 0,
          ttlAt: expiresAt,
        },
      },
      { new: true, upsert: true }
    );

    return { success: true, data: updated };
  } catch (err) {
    console.error('setCode error:', err);
    return { success: false, message: 'Failed to create code' };
  }
}

const MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL_MIN = 15; // minutes
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET; // set this in .env


export async function verifyResetCode(email, code, purpose = 'forgot') {
  const now = new Date();
  const doc = await Code.findOne({ email: email.toLowerCase(), purpose }).lean();

  if (!doc) {
    return { success: false, message: 'Invalid or expired code.' };
  }

  if (doc.used) {
    return { success: false, message: 'Code already used. Request a new one.' };
  }

  if (doc.expiresAt <= now) {
    return { success: false, message: 'Code expired. Request a new one.' };
  }

  if (doc.attempts >= MAX_ATTEMPTS) {
    return { success: false, message: 'Too many attempts. Request a new code.' };
  }

  if (doc.code !== code) {
    await Code.updateOne(
      { _id: doc._id },
      { $inc: { attempts: 1 } }
    );
    const left = Math.max(0, MAX_ATTEMPTS - (doc.attempts + 1));
    return { success: false, message: left ? `Incorrect code. ${left} attempt(s) left.` : 'Too many attempts. Request a new code.' };
  }

  // Mark used
  await Code.updateOne({ _id: doc._id }, { $set: { used: true } });

  // Issue short-lived reset token (JWT) that authorizes resetting password
  const resetToken = jwt.sign(
    { sub: email.toLowerCase(), purpose }, // keep payload small
    JWT_RESET_SECRET,
    { expiresIn: `${RESET_TOKEN_TTL_MIN}m` }
  );

  return {
    success: true,
    message: 'Code verified.',
    resetToken,
    expiresInMinutes: RESET_TOKEN_TTL_MIN,
  };
}

export async function performPasswordReset(resetToken, newPassword) {
  try {
    const payload = jwt.verify(resetToken, JWT_RESET_SECRET);

    if (payload.purpose !== 'forgot' || !payload.sub) {
      return { success: false, message: 'Invalid reset token.' };
    }

    const email = payload.sub;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters.' };
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return { success: true, message: 'Password reset successfully.' };
  } catch (err) {
    return { success: false, message: 'Invalid or expired reset token.' };
  }
}



module.exports = {
  signup,
  login,
  getAllRestaurants,
  getRestaurantById,
  getFoodItemsByRestaurant,
  searchFoodItems,
  setCode
};