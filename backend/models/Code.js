const mongoose = require('mongoose');

const CodeSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        code: { type: String, required: true },
        purpose: { type: String, enum: ['forgot'], required: true, index: true },
        expiresAt: { type: Date, required: true, index: true },
        used: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        lastSentAt: { type: Date, },
        resendCount: { type: Number, default: 0 },
    },
    { timestamps: true, collection: 'codes' }
);

CodeSchema.index({ email: 1, purpose: 1 }, { unique: true });

CodeSchema.add({ ttlAt: { type: Date, default: null, index: { expireAfterSeconds: 0 } } });

module.exports = mongoose.model('Code', CodeSchema);
