const mongoose = require('mongoose');

const accountDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    month: {
        type: Number,  // 1-12
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    dailySpends: [{
        date: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            default: 0
        }
    }],
    monthlyTotal: {
        type: Number,
        default: 0
    },
    lastTransaction: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create compound indexes for efficient querying
accountDataSchema.index({ userId: 1, month: 1, year: 1 });
accountDataSchema.index({ userId: 1, 'dailySpends.date': 1 });

module.exports = mongoose.model('AccountData', accountDataSchema); 