const mongoose = require('mongoose');

const transactionDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    dayOfWeek: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    weekOfYear: {
        type: Number,
        required: true
    },
    month: {
        type: Number,  // 1-12
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    rawText: {
        type: String,  // Store the raw OCR text
        required: false
    },
    source: {
        type: String,
        enum: ['gpay', 'phonepe', 'paytm', 'other'],
        default: 'other'
    }
}, {
    timestamps: true
});

// Create compound indexes for common queries
transactionDataSchema.index({ userId: 1, transactionDate: -1 });
transactionDataSchema.index({ userId: 1, dayOfWeek: 1 });
transactionDataSchema.index({ userId: 1, month: 1, year: 1 });
transactionDataSchema.index({ userId: 1, weekOfYear: 1, year: 1 });

module.exports = mongoose.model('TransactionData', transactionDataSchema); 