const CashScore = require('../models/CashScore');
const UserController = require('./userController');
const SCORE_CONFIG = require('../config/scoreConfig');

class CashScoreController {
    static async initializeUserScore(userId) {
        try {
            let userScore = await CashScore.findOne({ userId });
            
            if (!userScore) {
                userScore = new CashScore({
                    userId,
                    score: SCORE_CONFIG.INITIAL_SCORE,
                    currentStreak: 0,
                    longestStreak: 0,
                    streakStartDate: new Date(),
                    lastUpdateDate: new Date(),
                    streakHistory: [],
                    achievements: [],
                    monthlyStats: new Map()
                });
                await userScore.save();
            }
            
            return userScore;
        } catch (error) {
            console.error('Error initializing user score:', error);
            throw error;
        }
    }

    static async updateDailyScore(userId, dailyBudget, dailySpent) {
        try {
            let userScore = await this.initializeUserScore(userId);
            const today = new Date();
            const lastUpdate = userScore.lastUpdateDate;
            
            // Check if this is a new day
            const isNewDay = !lastUpdate || 
                lastUpdate.getDate() !== today.getDate() ||
                lastUpdate.getMonth() !== today.getMonth() ||
                lastUpdate.getFullYear() !== today.getFullYear();

            if (!isNewDay) {
                console.log('Score already updated today for user:', userId);
                return userScore;
            }

            // Calculate score changes
            let scoreChange = 0;
            const isUnderBudget = dailySpent <= dailyBudget;
            
            if (isUnderBudget) {
                // Increment streak and calculate bonus
                userScore.currentStreak++;
                scoreChange = userScore.calculateStreakBonus(dailySpent, dailyBudget);
                
                // Update longest streak if applicable
                if (userScore.currentStreak > userScore.longestStreak) {
                    userScore.longestStreak = userScore.currentStreak;
                }
            } else {
                // Calculate penalty and reset streak
                scoreChange = -userScore.calculatePenalty(dailyBudget, dailySpent);
                userScore.currentStreak = 0;
                userScore.streakStartDate = today;
            }

            // Update score (ensure it doesn't go below minimum)
            userScore.score = Math.max(
                SCORE_CONFIG.LIMITS.MIN_SCORE,
                userScore.score + scoreChange
            );

            // Update streak history
            userScore.streakHistory.push({
                date: today,
                status: isUnderBudget ? 'maintained' : 'broken',
                budget: dailyBudget,
                spent: dailySpent,
                scoreChange,
                newScore: userScore.score
            });

            // Trim history if it exceeds the configured limit
            if (userScore.streakHistory.length > SCORE_CONFIG.HISTORY.MAX_ENTRIES) {
                userScore.streakHistory = userScore.streakHistory.slice(-SCORE_CONFIG.HISTORY.MAX_ENTRIES);
            }

            // Update monthly stats
            const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            const monthStats = userScore.monthlyStats.get(monthKey) || {
                averageScore: userScore.score,
                totalStreaks: 0,
                longestStreakInMonth: 0,
                daysUnderBudget: 0,
                totalDays: 0
            };

            monthStats.totalDays++;
            if (isUnderBudget) {
                monthStats.daysUnderBudget++;
            }
            if (userScore.currentStreak > monthStats.longestStreakInMonth) {
                monthStats.longestStreakInMonth = userScore.currentStreak;
            }
            monthStats.averageScore = (
                (monthStats.averageScore * (monthStats.totalDays - 1) + userScore.score) / 
                monthStats.totalDays
            );
            userScore.monthlyStats.set(monthKey, monthStats);

            // Check for new achievements
            const newAchievements = userScore.checkAchievements();
            if (newAchievements.length > 0) {
                userScore.achievements.push(...newAchievements);
            }

            userScore.lastUpdateDate = today;
            await userScore.save();

            return {
                score: userScore.score,
                currentStreak: userScore.currentStreak,
                scoreChange,
                newAchievements
            };
        } catch (error) {
            console.error('Error updating daily score:', error);
            throw error;
        }
    }

    static async getUserStats(userId) {
        try {
            let userScore = await CashScore.findOne({ userId });
            
            // If no score exists, initialize it
            if (!userScore) {
                userScore = await this.initializeUserScore(userId);
            }

            // Return formatted stats
            return {
                currentScore: userScore.score,
                currentStreak: userScore.currentStreak,
                longestStreak: userScore.longestStreak,
                achievements: userScore.achievements,
                recentHistory: userScore.streakHistory.slice(-SCORE_CONFIG.HISTORY.DISPLAY_ENTRIES),
                monthlyStats: userScore.monthlyStats.get(this.getCurrentMonthKey()) || {
                    averageScore: userScore.score,
                    totalStreaks: 0,
                    longestStreakInMonth: 0,
                    daysUnderBudget: 0,
                    totalDays: 0
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    // Helper function to get current month key
    static getCurrentMonthKey() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}`;
    }

    static async getLeaderboard(limit = SCORE_CONFIG.LEADERBOARD.DEFAULT_LIMIT) {
        try {
            return await CashScore.find()
                .sort({ score: -1, currentStreak: -1 })
                .limit(limit)
                .select('userId score currentStreak achievements')
                .populate('userId', 'name'); // Assuming User model has a name field
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }
}

module.exports = CashScoreController; 