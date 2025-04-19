require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const { PORT } = require('./config/config');
const WhatsAppService = require('./services/whatsappService');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Initialize WhatsApp service
const whatsappService = new WhatsAppService();
whatsappService.initialize();

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
}); 