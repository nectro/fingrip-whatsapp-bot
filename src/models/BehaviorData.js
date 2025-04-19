const mongoose = require('mongoose');

const behaviorDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    onboardingAnswers: {
        wakeTime: String,
        status: String,
        cityType: String,
        moneyFlow: String,
        living: String,
        monthlyBurn: String,
        surprise1000: String
    },
    geminiAnalysis: {
        weekly_budget: {
            Monday: Number,
            Tuesday: Number,
            Wednesday: Number,
            Thursday: Number,
            Friday: Number,
            Saturday: Number,
            Sunday: Number
        },
        nudge_slots: [String],
        personality_type: String,
        personality_definition: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BehaviorData', behaviorDataSchema); 