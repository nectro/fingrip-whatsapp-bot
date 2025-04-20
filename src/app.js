require('dotenv').config();
const express = require('express');
const connectDB = require('./config/database');
const { PORT } = require('./config/config');
const WhatsAppService = require('./services/whatsappService');
const botUpdateRoutes = require('./routes/botUpdateRoutes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());  // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded bodies

// Initialize WhatsApp service
const whatsappService = new WhatsAppService();
whatsappService.initialize();

// Make WhatsApp service available to routes
app.set('whatsappService', whatsappService);

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Register routes
app.use('/api', botUpdateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
}); 