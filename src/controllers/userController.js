const User = require('../models/User');
const BehaviorData = require('../models/BehaviorData');

class UserController {
    static async findOrCreateUser(phoneNumber) {
        try {
            let user = await User.findOne({ phoneNumber });
            
            if (!user) {
                user = await User.create({
                    phoneNumber,
                    onboardingStatus: 'not_started',
                    currentStep: 0
                });

                // Create empty behavior data
                await BehaviorData.create({
                    userId: user._id,
                    onboardingAnswers: {},
                    lastUpdated: new Date()
                });
            }
            
            return user;
        } catch (error) {
            console.error('Error in findOrCreateUser:', error);
            throw error;
        }
    }

    static async updateOnboardingStatus(userId, status, step) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    onboardingStatus: status,
                    currentStep: step,
                    lastActive: new Date()
                },
                { new: true }
            );
            return user;
        } catch (error) {
            console.error('Error in updateOnboardingStatus:', error);
            throw error;
        }
    }

    static async saveOnboardingAnswer(userId, questionKey, answer) {
        try {
            // Get existing behavior data
            let behaviorData = await BehaviorData.findOne({ userId });
            
            if (!behaviorData) {
                behaviorData = await BehaviorData.create({
                    userId,
                    onboardingAnswers: {},
                    lastUpdated: new Date()
                });
            }

            // Update the specific answer
            const updatedAnswers = {
                ...behaviorData.onboardingAnswers,
                [questionKey]: answer
            };

            // Save the updated answers
            behaviorData = await BehaviorData.findOneAndUpdate(
                { userId },
                {
                    onboardingAnswers: updatedAnswers,
                    lastUpdated: new Date()
                },
                { new: true, upsert: true }
            );

            return behaviorData;
        } catch (error) {
            console.error('Error in saveOnboardingAnswer:', error);
            throw error;
        }
    }

    static async saveBehaviorData(userId, onboardingAnswers, geminiAnalysis) {
        try {
            // Update behavior data with Gemini analysis
            const behaviorData = await BehaviorData.findOneAndUpdate(
                { userId },
                {
                    geminiAnalysis,
                    lastUpdated: new Date()
                },
                { new: true }
            );

            // Update user status to completed
            await User.findByIdAndUpdate(
                userId,
                {
                    onboardingStatus: 'completed',
                    lastActive: new Date()
                }
            );

            return behaviorData;
        } catch (error) {
            console.error('Error in saveBehaviorData:', error);
            throw error;
        }
    }

    static async getUserProfile(userId) {
        try {
            const [user, behaviorData] = await Promise.all([
                User.findById(userId),
                BehaviorData.findOne({ userId })
            ]);

            return {
                user,
                behaviorData
            };
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            // First get all completed users
            const users = await User.find({
                onboardingStatus: 'completed'
            });

            // Then get their behavior data with nudge slots
            const usersWithBehavior = await Promise.all(
                users.map(async (user) => {
                    const behaviorData = await BehaviorData.findOne({
                        userId: user._id,
                        'geminiAnalysis.nudge_slots': { $exists: true, $ne: [] }
                    });

                    if (behaviorData) {
                        return {
                            ...user.toObject(),
                            behaviorData: behaviorData.toObject()
                        };
                    }
                    return null;
                })
            );

            // Filter out users without behavior data
            return usersWithBehavior.filter(user => user !== null);
        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }
}

module.exports = UserController; 