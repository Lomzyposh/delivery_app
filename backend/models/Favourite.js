const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true, index: true },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'favorites' });

FavoriteSchema.index({ userId: 1, foodId: 1 }, { unique: true });
module.exports = mongoose.model('Favorite', FavoriteSchema);
