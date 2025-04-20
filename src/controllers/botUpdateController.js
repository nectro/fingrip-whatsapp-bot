const BotUpdate = require('../models/BotUpdate');
const UserController = require('./userController');

class BotUpdateController {
    static async createUpdate(version, title, content) {
        try {
            // Check if version already exists
            const existingUpdate = await BotUpdate.findOne({ version });
            if (existingUpdate) {
                throw new Error('Version already exists');
            }

            // Create new update
            const update = await BotUpdate.create({
                version,
                title,
                content
            });

            return update;
        } catch (error) {
            console.error('Error creating bot update:', error);
            throw error;
        }
    }

    static async sendUpdateToAllUsers(updateId, whatsappClient) {
        try {
            const update = await BotUpdate.findById(updateId);
            if (!update) {
                throw new Error('Update not found');
            }

            // Get all active users
            const users = await UserController.getAllUsers();
            console.log(`Sending update to ${users.length} users`);

            const results = [];
            for (const userData of users) {
                try {
                    const user = userData.user || userData;
                    
                    if (!user || !user.phoneNumber) {
                        continue;
                    }

                    // Check if update already sent to this user
                    const alreadySent = update.sentTo.some(sent => 
                        sent.userId.toString() === user._id.toString()
                    );

                    if (alreadySent) {
                        continue;
                    }

                    // Format update message
                    const message = this.formatUpdateMessage(update);
                    
                    // Send message
                    await whatsappClient.sendMessage(user.phoneNumber, message);

                    // Record successful send
                    update.sentTo.push({
                        userId: user._id,
                        status: 'success'
                    });

                    results.push({
                        userId: user._id,
                        status: 'success'
                    });
                } catch (error) {
                    console.error(`Error sending update to user ${userData?.user?._id}:`, error);
                    
                    // Record failed send
                    update.sentTo.push({
                        userId: userData?.user?._id,
                        status: 'failed'
                    });

                    results.push({
                        userId: userData?.user?._id,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            // Save the updated sentTo list
            await update.save();

            return {
                totalUsers: users.length,
                results
            };
        } catch (error) {
            console.error('Error sending bot update:', error);
            throw error;
        }
    }

    static formatUpdateMessage(update) {
        return `🔔 *_Fingrip_ Update v${update.version}*\n` +
               `*${update.title}*\n\n` +
               `${update.content}\n\n` +
               `Type !help to see all available commands.`;
    }

    static async getUpdateHistory(limit = 10) {
        try {
            const updates = await BotUpdate.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('version title content createdAt sentTo');

            return updates.map(update => ({
                version: update.version,
                title: update.title,
                content: update.content || '',
                createdAt: update.createdAt,
                totalSent: update.sentTo.length,
                successCount: update.sentTo.filter(s => s.status === 'success').length,
                failureCount: update.sentTo.filter(s => s.status === 'failed').length
            }));
        } catch (error) {
            console.error('Error getting update history:', error);
            throw error;
        }
    }

    static async resetUpdateStatus(updateId) {
        try {
            const update = await BotUpdate.findById(updateId);
            if (!update) {
                throw new Error('Update not found');
            }

            // Clear the sentTo array
            update.sentTo = [];
            await update.save();

            return { message: 'Update status reset successfully' };
        } catch (error) {
            console.error('Error resetting update status:', error);
            throw error;
        }
    }
}

module.exports = BotUpdateController; 