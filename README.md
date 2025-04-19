# FinGrip WhatsApp Bot

A smart WhatsApp bot that helps users track and manage their personal finances through natural conversations and image processing.

## Features

- 🤖 Smart onboarding process to understand user's financial profile
- 💰 Personalized weekly budget recommendations
- 📸 OCR-powered transaction amount detection from payment screenshots
- 🧠 AI-powered financial insights using Google's Gemini API
- 🔔 Smart notification timing based on user's lifestyle

## Prerequisites

- Node.js v14 or higher
- WhatsApp account
- Google Gemini API key
- OCR.space API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd fingrip-whatsapp-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `temp` directory in the project root:
```bash
mkdir temp
```

4. Update the API keys in `src/config/config.js`:
```javascript
module.exports = {
    GEMINI_API_KEY: "your-gemini-api-key",
    OCR_API_KEY: "your-ocr-space-api-key",
    // ...
};
```

## Running the Bot

1. Start the server:
```bash
npm start
```

2. For development with auto-reload:
```bash
npm run dev
```

3. Scan the QR code that appears in the terminal with WhatsApp to link your device

## Usage

1. Send "hi" to start the onboarding process
2. Answer the lifestyle and financial questions
3. Receive personalized budget recommendations
4. Send payment screenshots to track expenses

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── models/         # Data models
├── routes/         # API routes
├── services/       # Business logic
└── utils/         # Helper functions
```

## Contributing

Feel free to open issues and submit pull requests.

## License

ISC 