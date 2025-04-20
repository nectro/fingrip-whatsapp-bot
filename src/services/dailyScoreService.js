const cron = require('node-cron');
const UserController = require('../controllers/userController');
const TransactionController = require('../controllers/transactionController');
const CashScoreController = require('../controllers/cashScoreController');

class DailyScoreService {
    constructor(whatsappClient) {
        this.whatsappClient = whatsappClient;
        this.setupCronJob();
    }

    setupCronJob() {
        // Run at 23:55 every day (5 minutes before midnight)
        cron.schedule('55 23 * * *', async () => {
            console.log('🕐 Running daily score update job...');
            await this.processDailyScores();
        });
    }

    async processDailyScores() {
        try {
            // Get all active users
            const users = await UserController.getAllUsers();
            console.log(`Processing scores for ${users.length} users`);

            for (const userData of users) {
                try {
                    // Extract user and behaviorData from the userData object
                    const user = userData.user || userData;
                    const behaviorData = userData.behaviorData;

                    if (!user || !user._id) {
                        console.log('Invalid user data:', userData);
                        continue;
                    }

                    const today = new Date();
                    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

                    // Get daily budget from behavior data
                    const dailyBudget = behaviorData?.geminiAnalysis?.weekly_budget?.[dayOfWeek] || 0;
                    if (!dailyBudget) {
                        console.log(`No daily budget set for user ${user._id} on ${dayOfWeek}`);
                        continue;
                    }

                    // Get total spent today
                    const dailySpent = await TransactionController.getDailySpend(user._id);

                    // Update cash score
                    const scoreUpdate = await CashScoreController.updateDailyScore(user._id, dailyBudget, dailySpent);

                    // Prepare and send WhatsApp message
                    if (user.phoneNumber) {  // Only send if we have a phone number
                        await this.sendScoreUpdateMessage(
                            user.phoneNumber,
                            scoreUpdate,
                            dailyBudget,
                            dailySpent,
                            dayOfWeek
                        );
                    } else {
                        console.log(`No phone number found for user ${user._id}`);
                    }

                } catch (error) {
                    console.error(`Error processing user ${userData?.user?._id || 'unknown'}:`, error);
                    continue; // Continue with next user even if one fails
                }
            }
            console.log('✅ Daily score update completed');
        } catch (error) {
            console.error('Error in processDailyScores:', error);
        }
    }

    async sendScoreUpdateMessage(phoneNumber, scoreUpdate, dailyBudget, dailySpent, dayOfWeek) {
        try {
            const {
                score,
                currentStreak,
                longestStreak,
                scoreChange,
                newAchievements,
                monthlyStats
            } = scoreUpdate;

            // Calculate various metrics
            const percentageUsed = (dailySpent / dailyBudget) * 100;
            const remaining = Math.max(0, dailyBudget - dailySpent);
            const isOverBudget = dailySpent > dailyBudget;
            const overBudgetAmount = isOverBudget ? dailySpent - dailyBudget : 0;

            // Build the message with sections
            let message = '🤓 *End of Day Report* \n';
            message += `${dayOfWeek}, ${new Date().toLocaleDateString()}\n\n`;

            // Budget Section
            message += '💰 *Today\'s Budget Overview*\n';
            message += `• Budget: ₹${dailyBudget}\n`;
            message += `• Spent: ₹${dailySpent}\n`;
            if (isOverBudget) {
                message += `• Overspent: ₹${overBudgetAmount} (${percentageUsed.toFixed(1)}% of budget)\n`;
                message += `❌ You went over budget today\n`;
            } else {
                message += `• Remaining: ₹${remaining}\n`;
                message += `✅ ${percentageUsed.toFixed(1)}% of budget used\n`;
            }

            // CashScore Section
            message += '\n🎯 *CashScore Update*\n';
            if (scoreChange > 0) {
                message += `🌟 Congratulations! +${scoreChange} points earned\n`;
            } else if (scoreChange < 0) {
                message += `📉 Score change: ${scoreChange} points\n`;
            }
            message += `• Current CashScore: ${score} points\n`;

            // Streak Section
            message += '\n🔥 *Streak Status*\n';
            if (currentStreak > 0) {
                message += `• Current streak: ${currentStreak} days\n`;
                message += `• All-time best: ${longestStreak} days\n`;
                if (currentStreak === longestStreak) {
                    message += `🏆 You're on your best streak ever!\n`;
                }
            } else {
                message += `• No active streak\n`;
                if (longestStreak > 0) {
                    message += `• Best streak: ${longestStreak} days\n`;
                }
                message += `💪 Stay within budget tomorrow to start a new streak!\n`;
            }

            // New Achievements
            if (newAchievements && newAchievements.length > 0) {
                message += '\n🏆 *New Achievements Unlocked!*\n';
                newAchievements.forEach(achievement => {
                    message += `• ${achievement.description} 🎉\n`;
                });
            }

            // Tips and Motivation
            message += '\n💡 *Quick Tip*\n';
            if (isOverBudget) {
                message += `Tomorrow's a new day! Plan ahead and track your spending to stay within budget.`;
            } else {
                message += `Great job managing your money today! Keep the momentum going!`;
            }

            // Send message via WhatsApp
            await this.whatsappClient.sendMessage(phoneNumber, message);

        } catch (error) {
            console.error('Error sending score update message:', error);
        }
    }
}

module.exports = DailyScoreService; 