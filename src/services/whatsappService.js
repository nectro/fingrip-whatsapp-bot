const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { WHATSAPP_CONFIG } = require('../config/config');
const { processImage } = require('./ocrService');
const { getPrompt, getGeminiResponse } = require('./geminiService');
const onboardingQuestions = require('../models/onboardingQuestions');
const UserController = require('../controllers/userController');
const TransactionController = require('../controllers/transactionController');
const CashScoreController = require('../controllers/cashScoreController');
const { BUDGET_NUDGES, getNudgeMessage, getProgressBar } = require('../config/budgetNudges');
const ScheduledNudgeService = require('./scheduledNudgeService');
const DailyScoreService = require('./dailyScoreService');
const COMMAND_CONFIG = require('../config/commandConfig');

// Store user states in memory
const userStates = {};

class WhatsAppService {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: WHATSAPP_CONFIG
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('📲 Scan this QR code with your WhatsApp:');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp bot is ready!');
            // Initialize services after WhatsApp client is ready
            this.scheduledNudgeService = new ScheduledNudgeService(this.client);
            this.dailyScoreService = new DailyScoreService(this.client);
        });

        this.client.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(msg) {
        try {
            const phoneNumber = msg.from;
            const user = await UserController.findOrCreateUser(phoneNumber);

            // Handle initial greeting
            if (user.onboardingStatus === 'not_started' && 
                ["hii", "hey", "hello", "hi"].includes(msg.body.trim().toLowerCase())) {
                return this.startOnboarding(msg, user);
            }

            // Handle onboarding flow
            if (user.onboardingStatus === 'in_progress') {
                return this.handleOnboardingResponse(msg, user);
            }

            // Handle post-onboarding messages
            if (user.onboardingStatus === 'completed') {
                return this.handlePostOnboardingMessage(msg, user);
            }

        } catch (error) {
            console.error('Error in handleMessage:', error);
            await msg.reply('⚠️ Something went wrong. Please try again later.');
        }
    }

    async startOnboarding(msg, user) {
        try {
            await UserController.updateOnboardingStatus(user._id, 'in_progress', 0);
            
            const welcomeMessage = `👋 Hey! Welcome to *FinGrip* — your smart money wingman.\n\nNo boring budgets. No guilt trips.\nJust chill vibes + clever nudges to keep your cash in check. 🧠💸\n\nWe get your flow, learn your style, and help you *spend smarter* — without killing the fun. 😎\n\nFirst, let's get to know you a bit 👇\n\n${onboardingQuestions[0].text}`;
            await msg.reply(welcomeMessage);
        } catch (error) {
            console.error('Error in startOnboarding:', error);
            await msg.reply('⚠️ Something went wrong. Please try again later.');
        }
    }

    async handleOnboardingResponse(msg, user) {
        try {
            const currentQ = onboardingQuestions[user.currentStep];
            const answer = msg.body.trim();

            if (!currentQ.optionsMap[answer]) {
                await msg.reply(`❌ Please answer with a valid option. For example: 1, 2, 3, or 4.`);
                return;
            }

            // Save the current answer
            await UserController.saveOnboardingAnswer(user._id, currentQ.key, answer);

            const nextStep = user.currentStep + 1;
            
            if (nextStep < onboardingQuestions.length) {
                // More questions to go
                await UserController.updateOnboardingStatus(user._id, 'in_progress', nextStep);
                await msg.reply(onboardingQuestions[nextStep].text);
            } else {
                // Onboarding complete, generate summary
                const profile = await UserController.getUserProfile(user._id);
                await this.generateAndSendSummary(msg, user._id, profile.behaviorData.onboardingAnswers);
            }
        } catch (error) {
            console.error('Error in handleOnboardingResponse:', error);
            await msg.reply('⚠️ Something went wrong. Please try again later.');
        }
    }

    async generateAndSendSummary(msg, userId, answers) {
        try {
            let summary = `🎉 You're all set! Here's what you shared:\n\n`;
            
            // Build profile for Gemini
            const profile = onboardingQuestions.map(q => {
                const selected = answers[q.key];
                const finalAnswer = q.optionsMap[selected];
                summary += `• *${q.key}*: ${finalAnswer}\n`;
                return `- ${q.key}: ${finalAnswer}`;
            }).join('\n');

            await msg.reply("🔍 Analyzing... Please wait...");

            // Get Gemini analysis
            const geminiPrompt = getPrompt(profile);
            const response = await getGeminiResponse(geminiPrompt);
            
            if (!response) {
                throw new Error('No response from Gemini API');
            }

            const geminiData = JSON.parse(response.replace(/```json|```/g, "").trim());

            // Save behavior data
            await UserController.saveBehaviorData(userId, answers, geminiData);

            // Build and send summary
            summary += `\n\n💰 *Your Personalized Smart Spending Week* 🗓️:\nPowered by your insights! 💡✨\n`;
            summary += `• Monday: ₹${geminiData.weekly_budget.Monday} – Start the week strong! 💪\n`;
            summary += `• Tuesday: ₹${geminiData.weekly_budget.Tuesday} – Keep things steady 🏃‍♂️\n`;
            summary += `• Wednesday: ₹${geminiData.weekly_budget.Wednesday} – Midweek momentum 🔄\n`;
            summary += `• Thursday: ₹${geminiData.weekly_budget.Thursday} – Almost there! 🔥\n`;
            summary += `• Friday: ₹${geminiData.weekly_budget.Friday} – Time to unwind a bit 💸\n`;
            summary += `• Saturday: ₹${geminiData.weekly_budget.Saturday} – Enjoy your weekend! 🎉\n`;
            summary += `• Sunday: ₹${geminiData.weekly_budget.Sunday} – Relax and recharge ✨\n`;

            summary += `\n\n🚀 *Pro Tip:* Made a GPay payment? Just hit *Share* on the receipt & send it here. I'll do the rest. 💡💰`;

            await msg.reply(summary);
        } catch (error) {
            console.error('Error in generateAndSendSummary:', error);
            await msg.reply("⚠️ Sorry, I had trouble analyzing your profile. Please try again later.");
        }
    }

    async handlePostOnboardingMessage(msg, user) {
        // Check for commands first
        const command = COMMAND_CONFIG.getCommand(msg.body);
        if (command) {
            return this.handleCommand(command, msg, user);
        }

        // Handle media messages (existing functionality)
        if (msg.hasMedia) {
            return this.handleTransactionImage(msg, user);
        }

        // If no command or media, show help message
        await msg.reply(COMMAND_CONFIG.getHelpMessage());
    }

    async handleCommand(command, msg, user) {
        try {
            switch (command) {
                case 'HELP':
                    await msg.reply(COMMAND_CONFIG.getHelpMessage());
                    break;

                case 'STATUS':
                    await this.sendStatusUpdate(msg, user);
                    break;

                default:
                    await msg.reply('❌ Unknown command. Type !help to see available commands.');
            }
        } catch (error) {
            console.error('Error handling command:', error);
            await msg.reply('⚠️ Error processing command. Please try again later.');
        }
    }

    async sendStatusUpdate(msg, user) {
        try {
            const today = new Date();
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

            // Fetch all necessary data
            const [profile, dailySpent] = await Promise.all([
                UserController.getUserProfile(user._id),
                TransactionController.getDailySpend(user._id)
            ]);

            // Initialize or get CashScore
            let cashScore = await CashScoreController.getUserStats(user._id);
            if (!cashScore) {
                // Initialize CashScore if it doesn't exist
                await CashScoreController.initializeUserScore(user._id);
                cashScore = {
                    currentScore: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    achievements: [],
                    monthlyStats: {
                        averageScore: 0,
                        daysUnderBudget: 0,
                        totalDays: 0
                    }
                };
            }

            const dailyBudget = profile.behaviorData?.geminiAnalysis?.weekly_budget?.[dayOfWeek] || 0;
            const percentageUsed = dailyBudget > 0 ? (dailySpent / dailyBudget) * 100 : 0;
            const progressBar = getProgressBar(percentageUsed);

            // Build status message
            let message = '🎯 *Your Current Status*\n\n';

            // Today's budget status
            message += '📅 *Today\'s Budget*\n';
            message += `💰 Budget: ₹${dailyBudget}\n`;
            message += `💸 Spent: ₹${dailySpent}\n`;
            message += `${progressBar} ${percentageUsed.toFixed(1)}%\n`;
            message += `Remaining: ₹${Math.max(0, dailyBudget - dailySpent)}\n\n`;

            // CashScore details
            message += '🏆 *CashScore Status*\n';
            message += `Current Score: ${cashScore.currentScore}\n`;
            if (cashScore.currentStreak > 0) {
                message += `🔥 Active Streak: ${cashScore.currentStreak} days\n`;
            }
            message += `🌟 Longest Streak: ${cashScore.longestStreak} days\n\n`;

            // Monthly stats
            if (cashScore.monthlyStats) {
                message += '📊 *This Month*\n';
                message += `Average Score: ${Math.round(cashScore.monthlyStats.averageScore)}\n`;
                message += `Days Under Budget: ${cashScore.monthlyStats.daysUnderBudget}/${cashScore.monthlyStats.totalDays}\n`;
            }

            // Recent achievements (last 3)
            if (cashScore.achievements && cashScore.achievements.length > 0) {
                message += '\n🎖️ *Recent Achievements*\n';
                cashScore.achievements.slice(-3).forEach(achievement => {
                    message += `• ${achievement.description}\n`;
                });
            } else {
                message += '\n💪 *Keep going!*\n';
                message += '• Stay under budget to earn achievements\n';
                message += '• Build streaks for bonus points\n';
                message += '• Save more to unlock rewards\n';
            }

            await msg.reply(message);

        } catch (error) {
            console.error('Error sending status update:', error);
            await msg.reply('⚠️ Error fetching your status. Please try again later.');
        }
    }

    async handleTransactionImage(msg, user) {
        try {
            const media = await msg.downloadMedia();
            const result = await processImage(media.data);

            if (result.success && result.amount) {
                // Extract numeric amount from the detected string
                const numericAmount = parseFloat(result.amount.replace(/[^0-9.]/g, ''));

                if (isNaN(numericAmount)) {
                    await msg.reply('⚠️ Could not parse the amount from the image.');
                    return;
                }

                // Save transaction
                const transaction = await TransactionController.saveTransaction(
                    user._id,
                    numericAmount,
                    result.rawText
                );

                // Get daily total
                const dailyTotal = await TransactionController.getDailySpend(user._id);

                // Get user's behavior data for budget comparison
                const profile = await UserController.getUserProfile(user._id);
                const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                const dailyBudget = profile.behaviorData?.geminiAnalysis?.weekly_budget?.[dayOfWeek] || 0;

                // Calculate percentage and get appropriate nudge
                const percentageUsed = dailyBudget > 0 ? (dailyTotal / dailyBudget) * 100 : 0;
                const { message: nudgeMessage, indicator } = getNudgeMessage(percentageUsed);
                const progressBar = getProgressBar(percentageUsed);

                // Prepare response message
                let response = `💰 Transaction recorded: ₹${numericAmount.toFixed(2)}\n\n`;
                
                if (dailyBudget > 0) {
                    response += `📊 Today's spending:\n`;
                    response += `${progressBar} ${percentageUsed.toFixed(1)}%\n`;
                    response += `₹${dailyTotal.toFixed(2)} of ₹${dailyBudget} ${indicator}\n\n`;
                    response += nudgeMessage;
                } else {
                    response += `📊 Today's total spend: ₹${dailyTotal.toFixed(2)}\n`;
                    response += `⚠️ No daily budget set. Would you like to set one?`;
                }

                await msg.reply(response);
            } else {
                await msg.reply(`😓 Couldn't detect any clear transaction amount from the image.`);
            }
        } catch (error) {
            console.error('Error processing transaction:', error);
            await msg.reply('⚠️ Something went wrong while processing your transaction.');
        }
    }

    initialize() {
        this.client.initialize();
    }
}

module.exports = WhatsAppService; 