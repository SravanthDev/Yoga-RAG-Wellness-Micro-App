
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    query: { type: String, required: true },
    answer: { type: String, required: true },
    sources: [{ type: String }],
    isUnsafe: { type: Boolean, default: false },
    unsafeReasons: [{ type: String }],
    feedback: { type: String, enum: ['up', 'down', null], default: null },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
