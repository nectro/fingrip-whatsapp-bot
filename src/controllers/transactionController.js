const TransactionData = require('../models/TransactionData');
const AccountData = require('../models/AccountData');

class TransactionController {
    static async saveTransaction(userId, amount, rawText = '') {
        try {
            const transactionDate = new Date();
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][transactionDate.getDay()];
            
            // Get week number (1-52)
            const weekOfYear = getWeekNumber(transactionDate);
            
            // Create transaction record
            const transaction = await TransactionData.create({
                userId,
                amount,
                dayOfWeek,
                weekOfYear,
                month: transactionDate.getMonth() + 1, // 1-12
                year: transactionDate.getFullYear(),
                transactionDate,
                rawText,
                source: detectPaymentSource(rawText)
            });

            // Update both daily and monthly spend in one operation
            await this.updateAccountData(userId, amount, transactionDate);

            return transaction;
        } catch (error) {
            console.error('Error in saveTransaction:', error);
            throw error;
        }
    }

    static async updateAccountData(userId, amount, date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            // Find or create account data for the month
            const accountData = await AccountData.findOneAndUpdate(
                {
                    userId,
                    month,
                    year
                },
                {
                    $push: {
                        dailySpends: {
                            $each: [{
                                date: startOfDay,
                                amount
                            }],
                            $sort: { date: 1 }
                        }
                    },
                    $inc: { monthlyTotal: amount },
                    $set: { lastTransaction: date }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

            // Aggregate daily amounts for the same date using $group
            await AccountData.updateOne(
                { _id: accountData._id },
                [{
                    $set: {
                        dailySpends: {
                            $reduce: {
                                input: {
                                    $map: {
                                        input: {
                                            $setUnion: "$dailySpends.date"
                                        },
                                        as: "uniqueDate",
                                        in: {
                                            date: "$$uniqueDate",
                                            amount: {
                                                $sum: {
                                                    $map: {
                                                        input: {
                                                            $filter: {
                                                                input: "$dailySpends",
                                                                cond: { $eq: ["$$this.date", "$$uniqueDate"] }
                                                            }
                                                        },
                                                        as: "spend",
                                                        in: "$$spend.amount"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                initialValue: [],
                                in: { $concatArrays: ["$$value", ["$$this"]] }
                            }
                        }
                    }
                }]
            );
        } catch (error) {
            console.error('Error in updateAccountData:', error);
            throw error;
        }
    }

    static async getDailySpend(userId, date = new Date()) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const accountData = await AccountData.findOne(
                {
                    userId,
                    month: startOfDay.getMonth() + 1,
                    year: startOfDay.getFullYear(),
                    'dailySpends.date': startOfDay
                },
                {
                    'dailySpends.$': 1
                }
            );

            return accountData?.dailySpends?.[0]?.amount || 0;
        } catch (error) {
            console.error('Error in getDailySpend:', error);
            throw error;
        }
    }
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper function to detect payment source from OCR text
function detectPaymentSource(rawText) {
    const text = rawText.toLowerCase();
    if (text.includes('gpay') || text.includes('google pay')) return 'gpay';
    if (text.includes('phonepe')) return 'phonepe';
    if (text.includes('paytm')) return 'paytm';
    return 'other';
}

module.exports = TransactionController; 