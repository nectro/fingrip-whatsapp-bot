const COMMAND_CONFIG = {
    PREFIX: '!',  // Command prefix
    COMMANDS: {
        STATUS: {
            keywords: ['status', 'stats', 'score'],
            description: 'Check your current budget status, CashScore, and achievements',
            usage: '!status',
            example: '!status'
        },
        HELP: {
            keywords: ['help', 'commands', '?'],
            description: 'List all available commands',
            usage: '!help',
            example: '!help'
        }
    },
    // Helper function to get command from message
    getCommand: (message) => {
        const text = message.toLowerCase().trim();
        if (!text.startsWith(COMMAND_CONFIG.PREFIX)) return null;

        const commandText = text.slice(COMMAND_CONFIG.PREFIX.length).trim();
        
        for (const [cmd, config] of Object.entries(COMMAND_CONFIG.COMMANDS)) {
            if (config.keywords.includes(commandText)) {
                return cmd;
            }
        }
        return null;
    },
    // Helper function to format help message
    getHelpMessage: () => {
        let message = '📚 *Available Commands*\n\n';
        
        for (const [cmd, config] of Object.entries(COMMAND_CONFIG.COMMANDS)) {
            message += `*${config.usage}*\n`;
            message += `📝 ${config.description}\n`;
            message += `💡 Keywords: ${config.keywords.map(k => COMMAND_CONFIG.PREFIX + k).join(', ')}\n\n`;
        }

        return message;
    }
};

module.exports = COMMAND_CONFIG; 