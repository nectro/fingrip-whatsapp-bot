const BUDGET_NUDGES = {
    // Thresholds for different budget utilization levels (in percentages)
    THRESHOLDS: {
        SAFE: 50,
        WARNING: 80,
        DANGER: 100,
        CRITICAL: 120
    },

    // Time-based thresholds (24-hour format)
    TIME_THRESHOLDS: {
        MORNING: {
            END: 12, // 12:00 PM
            WARNING_AT: 40 // Warn if spent 40% before noon
        },
        AFTERNOON: {
            END: 17, // 5:00 PM
            WARNING_AT: 70 // Warn if spent 70% before evening
        },
        EVENING: {
            END: 21, // 9:00 PM
            WARNING_AT: 90 // Warn if spent 90% before night
        }
    },

    // Scheduled nudge slots configuration
    NUDGE_SLOTS: {
        A: {
            START: 8,  // 8:00 AM
            END: 11,   // 11:00 AM
            LABEL: "Morning",
            CHECK_POINTS: [8, 9, 10] // Hours when to check and send nudges
        },
        B: {
            START: 11, // 11:00 AM
            END: 15,   // 3:00 PM
            LABEL: "Mid-day",
            CHECK_POINTS: [11, 13, 14] // Hours when to check and send nudges
        },
        C: {
            START: 15, // 3:00 PM
            END: 19,   // 7:00 PM
            LABEL: "Evening",
            CHECK_POINTS: [15, 17, 18] // Hours when to check and send nudges
        },
        D: {
            START: 19, // 7:00 PM
            END: 22,   // 10:00 PM
            LABEL: "Night",
            CHECK_POINTS: [19, 20, 21] // Hours when to check and send nudges
        }
    },

    // Message templates for different scenarios
    MESSAGES: {
        // When spending is within safe limits (< 50%)
        SAFE: [
            "🌟 Looking good! You're keeping things under control.",
            "💫 Smooth sailing with your spending today!",
            "🎯 Nice work staying within budget!",
            "✨ You're managing your money like a pro!"
        ],

        // When approaching budget limit (50-80%)
        WARNING: [
            "🤔 Heads up! Your spending is picking up pace today.",
            "💭 Still some budget left, but might want to ease up a bit.",
            "📊 You're in the yellow zone - keep an eye on that spending!",
            "💡 Pro tip: Maybe save some budget for later today?"
        ],

        // When very close to budget (80-100%)
        DANGER: [
            "⚠️ Getting close to today's budget limit!",
            "🚧 Careful there! Almost at your daily budget cap.",
            "⏰ Time to hit the brakes on spending?",
            "🎯 Nearly hit your target for today - think twice before the next spend!"
        ],

        // When exceeded budget (>100%)
        CRITICAL: [
            "🔥 Whoa there! You've crossed today's budget.",
            "💸 Budget exceeded! Might want to cool it down now.",
            "🚨 Over budget alert! Let's try to reign it in.",
            "⚡ Budget overflow! Tomorrow's a new day to get back on track."
        ],

        // Special messages for specific percentages
        EXACT_100: [
            "🎯 Bullseye! You've hit exactly 100% of your budget.",
            "✨ Perfect landing at your budget target!"
        ],

        // Messages for very low spending (<20%)
        VERY_LOW: [
            "💰 Super frugal today! Your wallet must be happy.",
            "🌱 Starting slow and steady - that's the way!"
        ],

        // Time-based warning messages
        TIME_WARNINGS: {
            MORNING: [
                "⏰ Spending quite fast this morning! Remember, it's not even noon yet.",
                "🌅 Early bird spending! Might want to pace yourself for the rest of the day.",
                "☀️ Morning splurge alert! Keep some budget for later today."
            ],
            AFTERNOON: [
                "🌤️ You've spent quite a bit and the day's not over yet!",
                "🕒 Mid-day check: Your spending is moving faster than time today.",
                "🌞 Afternoon heads-up: Might want to slow down the spending."
            ],
            EVENING: [
                "🌆 Evening alert: Budget's running low for night activities!",
                "🌙 Night's young but your budget isn't! Tread carefully.",
                "🎯 Getting late, and you're spending fast today!"
            ]
        },

        // Scheduled nudge messages
        SCHEDULED_NUDGES: {
            NO_SPENDING: [
                "👋 How's your day going? No spending recorded yet today.",
                "💭 Just checking in! Your wallet's been quiet today.",
                "🌟 Fresh start! No expenses logged yet today."
            ],
            UNDER_BUDGET: [
                "📊 Budget check: You're doing great! Still ₹{remaining} left for today.",
                "💫 Looking good! You've got ₹{remaining} left in today's budget.",
                "✨ Nice work! ₹{remaining} remaining in your daily budget."
            ],
            NEAR_LIMIT: [
                "⚠️ Quick update: Only ₹{remaining} left in today's budget!",
                "🎯 Heads up! You have ₹{remaining} remaining for today.",
                "💡 Budget alert: ₹{remaining} left to spend today."
            ],
            OVER_BUDGET: [
                "📈 Update: You're ₹{overspent} over today's budget.",
                "💸 Check-in: Currently ₹{overspent} above your daily budget.",
                "🔔 FYI: Spending is ₹{overspent} over today's budget."
            ]
        }
    },

    // Emoji indicators for different budget levels
    INDICATORS: {
        SAFE: "🟢",
        WARNING: "🟡",
        DANGER: "🟠",
        CRITICAL: "🔴"
    },

    // Configuration for progress bar
    PROGRESS_BAR: {
        LENGTH: 10,
        FILL: "■",
        EMPTY: "□"
    }
};

// Helper function to get a random message from an array
const getRandomMessage = (messages) => {
    return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to get current time period
const getTimePeriod = (hour) => {
    if (hour < BUDGET_NUDGES.TIME_THRESHOLDS.MORNING.END) return 'MORNING';
    if (hour < BUDGET_NUDGES.TIME_THRESHOLDS.AFTERNOON.END) return 'AFTERNOON';
    if (hour < BUDGET_NUDGES.TIME_THRESHOLDS.EVENING.END) return 'EVENING';
    return 'NIGHT';
};

// Function to check if spending is too fast for current time
const isSpendingTooFast = (percentageUsed, hour) => {
    const period = getTimePeriod(hour);
    const threshold = BUDGET_NUDGES.TIME_THRESHOLDS[period]?.WARNING_AT;
    return threshold ? percentageUsed > threshold : false;
};

// Function to get appropriate message based on percentage and time
const getNudgeMessage = (percentageUsed) => {
    let message = '';
    let indicator = '';
    const currentHour = new Date().getHours();

    // Check for time-based warnings first
    if (isSpendingTooFast(percentageUsed, currentHour)) {
        const period = getTimePeriod(currentHour);
        if (BUDGET_NUDGES.MESSAGES.TIME_WARNINGS[period]) {
            message = getRandomMessage(BUDGET_NUDGES.MESSAGES.TIME_WARNINGS[period]);
            // Use warning or danger indicator based on how much the threshold is exceeded
            indicator = percentageUsed > BUDGET_NUDGES.THRESHOLDS.WARNING ? 
                BUDGET_NUDGES.INDICATORS.DANGER : 
                BUDGET_NUDGES.INDICATORS.WARNING;
            return { message, indicator };
        }
    }

    // Regular percentage-based messages
    if (percentageUsed < 20) {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.VERY_LOW);
        indicator = BUDGET_NUDGES.INDICATORS.SAFE;
    } else if (percentageUsed < BUDGET_NUDGES.THRESHOLDS.SAFE) {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.SAFE);
        indicator = BUDGET_NUDGES.INDICATORS.SAFE;
    } else if (percentageUsed < BUDGET_NUDGES.THRESHOLDS.WARNING) {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.WARNING);
        indicator = BUDGET_NUDGES.INDICATORS.WARNING;
    } else if (percentageUsed < BUDGET_NUDGES.THRESHOLDS.DANGER) {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.DANGER);
        indicator = BUDGET_NUDGES.INDICATORS.DANGER;
    } else {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.CRITICAL);
        indicator = BUDGET_NUDGES.INDICATORS.CRITICAL;
    }

    // Special case for exactly 100%
    if (percentageUsed === 100) {
        message = getRandomMessage(BUDGET_NUDGES.MESSAGES.EXACT_100);
    }

    return { message, indicator };
};

// Function to get scheduled nudge message
const getScheduledNudgeMessage = (dailyTotal, dailyBudget) => {
    if (dailyTotal === 0) {
        return getRandomMessage(BUDGET_NUDGES.MESSAGES.SCHEDULED_NUDGES.NO_SPENDING);
    }

    const remaining = dailyBudget - dailyTotal;
    const percentageUsed = (dailyTotal / dailyBudget) * 100;

    let template;
    if (percentageUsed > 100) {
        template = getRandomMessage(BUDGET_NUDGES.MESSAGES.SCHEDULED_NUDGES.OVER_BUDGET)
            .replace('{overspent}', Math.abs(remaining).toFixed(2));
    } else if (percentageUsed > 80) {
        template = getRandomMessage(BUDGET_NUDGES.MESSAGES.SCHEDULED_NUDGES.NEAR_LIMIT)
            .replace('{remaining}', remaining.toFixed(2));
    } else {
        template = getRandomMessage(BUDGET_NUDGES.MESSAGES.SCHEDULED_NUDGES.UNDER_BUDGET)
            .replace('{remaining}', remaining.toFixed(2));
    }

    return template;
};

// Function to generate a progress bar
const getProgressBar = (percentageUsed) => {
    const { LENGTH, FILL, EMPTY } = BUDGET_NUDGES.PROGRESS_BAR;
    const filledLength = Math.min(Math.round((percentageUsed / 100) * LENGTH), LENGTH);
    const emptyLength = LENGTH - filledLength;
    return FILL.repeat(filledLength) + EMPTY.repeat(emptyLength);
};

module.exports = {
    BUDGET_NUDGES,
    getNudgeMessage,
    getProgressBar,
    getScheduledNudgeMessage
}; 