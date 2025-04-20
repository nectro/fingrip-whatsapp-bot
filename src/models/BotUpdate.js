const mongoose = require('mongoose');

const botUpdateSchema = new mongoose.Schema({
    version: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sentTo: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Only keep the createdAt index
botUpdateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BotUpdate', botUpdateSchema); 