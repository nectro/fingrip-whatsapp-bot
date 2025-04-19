const cron = require('node-cron');
const { BUDGET_NUDGES, getScheduledNudgeMessage, getProgressBar } = require('../config/budgetNudges');
const UserController = require('../controllers/userController');
const TransactionController = require('../controllers/transactionController');
const WhatsAppService = require('./whatsappService');

class ScheduledNudgeService {
    constructor(whatsappClient) {
        this.whatsappClient = whatsappClient;
        this.setupCronJobs();
    }

    setupCronJobs() {
        // Create a map of all check points and their corresponding slots
        const checkPoints = new Map();
        Object.entries(BUDGET_NUDGES.NUDGE_SLOTS).forEach(([slot, config]) => {
            config.CHECK_POINTS.forEach(hour => {
                if (!checkPoints.has(hour)) {
                    checkPoints.set(hour, []);
                }
                checkPoints.get(hour).push(slot);
            });
        });

        // Set up cron jobs for each unique check point
        checkPoints.forEach((slots, hour) => {
            // Run at specific hour, at minute 0
            cron.schedule(`0 ${hour} * * *`, () => {
                this.sendScheduledNudges(slots);
            });
        });
    }

    async sendScheduledNudges(slots) {
        try {
            // Get all users
            const users = await UserController.getAllUsers();

            for (const user of users) {
                // Check if user has preferred slots that match current slots
                const userSlots = user.behaviorData?.geminiAnalysis?.nudge_slots || [];
                const shouldSendNudge = slots.some(slot => userSlots.includes(slot));

                if (shouldSendNudge) {
                    await this.sendNudgeToUser(user);
                }
            }
        } catch (error) {
            console.error('Error in sendScheduledNudges:', error);
        }
    }

    async sendNudgeToUser(user) {
        try {
            // Get today's spending
            const today = new Date();
            const dailyTotal = await TransactionController.getDailySpend(user._id, today);

            // Get user's daily budget for current day
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
            const dailyBudget = user.behaviorData?.geminiAnalysis?.weekly_budget?.[dayOfWeek] || 0;

            if (dailyBudget === 0) {
                return; // Skip if no budget is set
            }

            // Calculate percentage used
            const percentageUsed = (dailyTotal / dailyBudget) * 100;

            // Get appropriate message
            const message = getScheduledNudgeMessage(dailyTotal, dailyBudget);

            // Create progress bar
            const progressBar = getProgressBar(percentageUsed);

            // Prepare full message
            const fullMessage = `*Daily Budget Update* 📊\n\n${progressBar} ${percentageUsed.toFixed(1)}%\n₹${dailyTotal.toFixed(2)} of ₹${dailyBudget}\n\n${message}`;

            // Send message using WhatsApp client
            await this.whatsappClient.sendMessage(user.phoneNumber, fullMessage);

        } catch (error) {
            console.error(`Error sending nudge to user ${user._id}:`, error);
        }
    }
}

module.exports = ScheduledNudgeService; 