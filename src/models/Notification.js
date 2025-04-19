const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['daily_limit', 'weekly_summary', 'monthly_summary', 'overspend_alert', 'custom'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    scheduledFor: {
        type: Date,
        required: true,
        index: true
    },
    timeSlot: {
        type: String,
        enum: ['Slot A', 'Slot B', 'Slot C', 'Slot D'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    metadata: {
        currentSpend: Number,
        budgetLimit: Number,
        percentageUsed: Number,
        additionalInfo: mongoose.Schema.Types.Mixed
    },
    sentAt: Date,
    error: String
}, {
    timestamps: true
});

// Create compound index for scheduling queries
notificationSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('Notification', notificationSchema); 