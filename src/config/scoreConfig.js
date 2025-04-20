const SCORE_CONFIG = {
    // Initial score for new users
    INITIAL_SCORE: 0,

    // Streak thresholds and rewards
    STREAK: {
        THRESHOLDS: [
            {
                DAYS: 3,              // Bronze streak (3 days)
                POINTS: 1,
                NAME: 'BRONZE'
            },
            {
                DAYS: 5,              // Silver streak (5 days)
                POINTS: 2,
                NAME: 'SILVER'
            },
            {
                DAYS: 7,              // Gold streak (7 days)
                POINTS: 3,
                NAME: 'GOLD'
            },
            {
                DAYS: 10,             // Platinum streak (10 days)
                POINTS: 5,
                NAME: 'PLATINUM'
            },
            {
                DAYS: 15,             // Diamond streak (15 days)
                POINTS: 8,
                NAME: 'DIAMOND'
            },
            {
                DAYS: 21,             // Master streak (21 days)
                POINTS: 13,
                NAME: 'MASTER'
            },
            {
                DAYS: 30,             // Legend streak (30 days)
                POINTS: 21,
                NAME: 'LEGEND'
            }
        ],
        BONUS: {
            PERFECT_BUDGET: 2,    // Bonus points for spending exactly the budget amount
            SUPER_SAVER: 3        // Bonus points for spending less than 50% of budget
        }
    },

    // History configuration
    HISTORY: {
        MAX_ENTRIES: 30,         // Maximum number of history entries to store
        DISPLAY_ENTRIES: 7       // Number of recent entries to display in status
    },

    // Leaderboard configuration
    LEADERBOARD: {
        DEFAULT_LIMIT: 10        // Default number of users to show in leaderboard
    },

    // Penalty configuration
    PENALTY: {
        THRESHOLDS: [
            {
                PERCENT: 10,           // Minor overspend (up to 10% over budget)
                POINTS: 2,
                NAME: 'MINOR'
            },
            {
                PERCENT: 25,           // Moderate overspend (10-25% over budget)
                POINTS: 4,
                NAME: 'MODERATE'
            },
            {
                PERCENT: 50,           // Significant overspend (25-50% over budget)
                POINTS: 7,
                NAME: 'SIGNIFICANT'
            },
            {
                PERCENT: 75,           // Major overspend (50-75% over budget)
                POINTS: 11,
                NAME: 'MAJOR'
            },
            {
                PERCENT: 100,          // Severe overspend (75-100% over budget)
                POINTS: 15,
                NAME: 'SEVERE'
            },
            {
                PERCENT: 150,          // Critical overspend (100-150% over budget)
                POINTS: 18,
                NAME: 'CRITICAL'
            },
            {
                PERCENT: Infinity,     // Extreme overspend (>150% over budget)
                POINTS: 20,
                NAME: 'EXTREME'
            }
        ],
        STREAK_BREAK: {
            BASE_POINTS: 5,            // Additional penalty for breaking a streak
            MULTIPLIERS: [             // Multipliers based on broken streak length
                { DAYS: 7, MULTIPLIER: 1.5 },   // Breaking 7+ day streak
                { DAYS: 14, MULTIPLIER: 2.0 },  // Breaking 14+ day streak
                { DAYS: 21, MULTIPLIER: 2.5 },  // Breaking 21+ day streak
                { DAYS: 30, MULTIPLIER: 3.0 }   // Breaking 30+ day streak
            ]
        }
    },

    // Achievement thresholds
    ACHIEVEMENTS: {
        STREAKS: {
            FIRST: 3,            // First streak achievement
            WEEK: 7,             // Week master achievement
            INTERMEDIATE: 10,     // 10-day streak achievement
            MASTER: 30           // Master streak achievement
        },
        SCORES: {
            BEGINNER: 100,       // First score milestone
            INTERMEDIATE: 500,    // Second score milestone
            MASTER: 1000         // Master score milestone
        },
        SAVINGS: {
            SUPER_SAVER: 50      // Percentage below budget for super saver achievement
        }
    },

    // Score limits
    LIMITS: {
        MIN_SCORE: 0,           // Minimum possible score
        MAX_DAILY_POINTS: 10,   // Maximum points earnable in a day
        MAX_PENALTY: 20         // Maximum penalty per violation
    }
};

module.exports = SCORE_CONFIG; 