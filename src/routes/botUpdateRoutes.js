const express = require('express');
const router = express.Router();
const BotUpdateController = require('../controllers/botUpdateController');
const WhatsAppService = require('../services/whatsappService');

// Create a new bot update
router.post('/updates', async (req, res) => {
    try {
        const { version, title, content } = req.body;

        // Validate required fields
        if (!version || !title || !content) {
            return res.status(400).json({
                error: 'Missing required fields: version, title, and content are required'
            });
        }

        const update = await BotUpdateController.createUpdate(version, title, content);
        res.status(201).json(update);
    } catch (error) {
        if (error.message === 'Version already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send update to all users
router.post('/updates/:updateId/send', async (req, res) => {
    try {
        const { updateId } = req.params;
        const whatsappService = req.app.get('whatsappService');

        if (!whatsappService) {
            return res.status(500).json({
                error: 'WhatsApp service not initialized'
            });
        }

        const result = await BotUpdateController.sendUpdateToAllUsers(
            updateId,
            whatsappService.client
        );

        res.json(result);
    } catch (error) {
        if (error.message === 'Update not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get update history (HTML or JSON)
router.get('/updates', async (req, res) => {
    try {
        const { limit } = req.query;
        const updates = await BotUpdateController.getUpdateHistory(
            limit ? parseInt(limit) : 10
        );

        // Check if request wants JSON
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json(updates);
        }

        // Function to format content into HTML
        const formatContent = (content) => {
            if (!content) return '<li>No content available</li>';
            
            // Split content by newlines and filter out empty lines
            const lines = content.split('\n').filter(line => line.trim());
            
            // If no valid lines found
            if (lines.length === 0) return '<li>No content available</li>';
            
            // Convert lines to HTML list items
            return lines.map(line => {
                // Remove bullet points if they exist
                line = line.replace(/^[•\-\*]\s*/, '');
                return `<li>${line}</li>`;
            }).join('');
        };

        // Otherwise, return HTML
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fingrip Update History</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .update-card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .update-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .update-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                .version {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #2c3e50;
                    padding: 4px 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                .date {
                    color: #7f8c8d;
                    font-size: 0.9em;
                }
                .title {
                    font-size: 1.3em;
                    color: #34495e;
                    margin-bottom: 15px;
                    font-weight: 600;
                }
                .content {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 15px 20px;
                    margin: 15px 0;
                }
                .content ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .content li {
                    margin: 8px 0;
                    color: #2c3e50;
                    position: relative;
                }
                .content li::before {
                    content: "✨";
                    margin-right: 8px;
                    color: #3498db;
                }
                .stats {
                    display: flex;
                    gap: 20px;
                    font-size: 0.9em;
                    color: #7f8c8d;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                }
                .stat {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    background: #f8f9fa;
                }
                .success {
                    color: #27ae60;
                }
                .failure {
                    color: #e74c3c;
                }
                .total {
                    color: #3498db;
                }
                @media (max-width: 600px) {
                    .update-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    .stats {
                        flex-direction: column;
                        gap: 5px;
                    }
                    .content {
                        padding: 10px 15px;
                    }
                }
            </style>
        </head>
        <body>
            <h1>🤖 Fingrip Update History</h1>
            ${updates.map(update => `
                <div class="update-card">
                    <div class="update-header">
                        <span class="version">v${update.version}</span>
                        <span class="date">${new Date(update.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="title">${update.title}</div>
                    <div class="content">
                        <ul>
                            ${formatContent(update.content)}
                        </ul>
                    </div>
                    <div class="stats">
                        <div class="stat total">
                            📊 Total: ${update.totalSent}
                        </div>
                        <div class="stat success">
                            ✅ Success: ${update.successCount}
                        </div>
                        <div class="stat failure">
                            ❌ Failed: ${update.failureCount}
                        </div>
                    </div>
                </div>
            `).join('')}
        </body>
        </html>
        `;

        res.send(html);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reset update status (clear sent history)
router.post('/updates/:updateId/reset', async (req, res) => {
    try {
        const { updateId } = req.params;
        const result = await BotUpdateController.resetUpdateStatus(updateId);
        res.json(result);
    } catch (error) {
        if (error.message === 'Update not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 