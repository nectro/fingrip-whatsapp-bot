const mongoose = require('mongoose');
const SCORE_CONFIG = require('../config/scoreConfig');

const cashScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    score: {
        type: Number,
        default: 0,
        min: SCORE_CONFIG.LIMITS.MIN_SCORE
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    streakStartDate: {
        type: Date,
        default: Date.now
    },
    lastUpdateDate: {
        type: Date,
        default: Date.now
    },
    streakHistory: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['maintained', 'broken'],
            required: true
        },
        budget: {
            type: Number,
            required: true
        },
        spent: {
            type: Number,
            required: true
        },
        scoreChange: {
            type: Number,
            required: true
        },
        newScore: {
            type: Number,
            required: true
        }
    }],
    achievements: [{
        type: {
            type: String,
            enum: [
                'first_streak',      // First 3-day streak
                'week_master',       // First 7-day streak
                'comeback_king',     // Recovered from a broken streak to achieve a new one
                'budget_perfect',    // Stayed exactly on budget
                'super_saver',       // Spent less than 50% of budget
                'streak_10',         // Achieved 10-day streak
                'streak_30',         // Achieved 30-day streak
                'score_100',         // Reached 100 points
                'score_500',         // Reached 500 points
                'score_1000'         // Reached 1000 points
            ],
            required: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        },
        description: String
    }],
    monthlyStats: {
        type: Map,
        of: {
            averageScore: Number,
            totalStreaks: Number,
            longestStreakInMonth: Number,
            daysUnderBudget: Number,
            totalDays: Number
        }
    }
}, {
    timestamps: true
});

// Index for efficient queries
cashScoreSchema.index({ userId: 1, 'streakHistory.date': 1 });
cashScoreSchema.index({ score: -1 }); // For leaderboard queries
cashScoreSchema.index({ currentStreak: -1 }); // For streak-based queries

// Method to calculate penalty for going over budget
cashScoreSchema.methods.calculatePenalty = function(budgetAmount, spentAmount) {
    if (spentAmount <= budgetAmount) return 0;
    
    const overBudgetPercent = ((spentAmount - budgetAmount) / budgetAmount) * 100;
    let penalty = 0;

    // Find the appropriate penalty threshold
    const thresholds = SCORE_CONFIG.PENALTY.THRESHOLDS;
    let appliedThreshold = null;

    // Find the highest applicable threshold
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (overBudgetPercent <= thresholds[i].PERCENT) {
            appliedThreshold = thresholds[i];
            break;
        }
    }

    // If no threshold found (shouldn't happen due to Infinity threshold), use the highest
    if (!appliedThreshold) {
        appliedThreshold = thresholds[thresholds.length - 1];
    }

    penalty = appliedThreshold.POINTS;

    // Add streak break penalty if applicable
    if (this.currentStreak > 0) {
        let streakMultiplier = 1;
        const multipliers = SCORE_CONFIG.PENALTY.STREAK_BREAK.MULTIPLIERS;

        // Find the highest applicable streak multiplier
        for (let i = multipliers.length - 1; i >= 0; i--) {
            if (this.currentStreak >= multipliers[i].DAYS) {
                streakMultiplier = multipliers[i].MULTIPLIER;
                break;
            }
        }

        penalty += Math.round(SCORE_CONFIG.PENALTY.STREAK_BREAK.BASE_POINTS * streakMultiplier);
    }

    return Math.min(penalty, SCORE_CONFIG.LIMITS.MAX_PENALTY);
};

// Method to calculate streak bonus
cashScoreSchema.methods.calculateStreakBonus = function(spentAmount, budgetAmount) {
    const { currentStreak } = this;
    let bonus = 0;

    // Calculate points based on the highest achieved threshold
    const thresholds = SCORE_CONFIG.STREAK.THRESHOLDS;
    let highestAchievedThreshold = null;

    // Find the highest threshold achieved
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (currentStreak >= thresholds[i].DAYS) {
            highestAchievedThreshold = thresholds[i];
            break;
        }
    }

    // Award points based on highest achieved threshold
    if (highestAchievedThreshold) {
        bonus += highestAchievedThreshold.POINTS;
    }

    // Add perfect budget bonus
    if (spentAmount === budgetAmount) {
        bonus += SCORE_CONFIG.STREAK.BONUS.PERFECT_BUDGET;
    }

    // Add super saver bonus
    if (spentAmount <= (budgetAmount * (SCORE_CONFIG.ACHIEVEMENTS.SAVINGS.SUPER_SAVER / 100))) {
        bonus += SCORE_CONFIG.STREAK.BONUS.SUPER_SAVER;
    }

    return Math.min(bonus, SCORE_CONFIG.LIMITS.MAX_DAILY_POINTS);
};

// Method to check and award achievements
cashScoreSchema.methods.checkAchievements = function() {
    const newAchievements = [];
    const { currentStreak, score, achievements } = this;
    const existingAchievements = new Set(achievements.map(a => a.type));

    // Helper function to add achievement if not already earned
    const addAchievement = (type, description) => {
        if (!existingAchievements.has(type)) {
            newAchievements.push({ type, description });
        }
    };

    // Check streak-based achievements
    if (currentStreak >= SCORE_CONFIG.ACHIEVEMENTS.STREAKS.FIRST) {
        addAchievement('first_streak', 'Maintained budget for 3 days in a row!');
    }
    if (currentStreak >= SCORE_CONFIG.ACHIEVEMENTS.STREAKS.WEEK) {
        addAchievement('week_master', 'A full week of budget mastery!');
    }
    if (currentStreak >= SCORE_CONFIG.ACHIEVEMENTS.STREAKS.INTERMEDIATE) {
        addAchievement('streak_10', '10-day streak champion!');
    }
    if (currentStreak >= SCORE_CONFIG.ACHIEVEMENTS.STREAKS.MASTER) {
        addAchievement('streak_30', 'Budget master: 30-day streak!');
    }

    // Check score-based achievements
    if (score >= SCORE_CONFIG.ACHIEVEMENTS.SCORES.BEGINNER) {
        addAchievement('score_100', 'Reached 100 CashScore points!');
    }
    if (score >= SCORE_CONFIG.ACHIEVEMENTS.SCORES.INTERMEDIATE) {
        addAchievement('score_500', 'Reached 500 CashScore points!');
    }
    if (score >= SCORE_CONFIG.ACHIEVEMENTS.SCORES.MASTER) {
        addAchievement('score_1000', 'Reached 1000 CashScore points!');
    }

    return newAchievements;
};

module.exports = mongoose.model('CashScore', cashScoreSchema); 