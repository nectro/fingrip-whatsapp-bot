const axios = require('axios');
const { GEMINI_API_KEY } = require('../config/config');

const getPrompt = (profile) => {
  return `
      You are an AI assistant inside a personal finance app. A user has completed onboarding by answering a series of lifestyle and financial questions.
      Their profile is:
      ${profile}

      Based on their answers, generate the following output in **strict JSON format**:
      1. A \`weekly_budget\` — daily budget recommendations (in INR) for Monday to Sunday:
        - Consider lifestyle, city type, employment status, living situation, money flow, and habits around spending.
        - Apply a **15% buffer** to daily budget estimates.
        - Make **Friday and Saturday budgets higher** to reflect common social spending behavior.
      - weekdays should be around 400 - 600
      - one weekday should have a higher budget 800-900
      - weekend should have an avg of 1k per day
      2. Suggest the **two most relevant time slots** as \`nudge_slots\` to send money-related nudges/notifications, based on wake-up time, work style, and lifestyle habits. Choose any two from:
        - Slot A: 8am – 11am
        - Slot B: 11am – 3pm
        - Slot C: 3pm – 7pm
        - Slot D: 7pm – 10pm
      3. Assign a \`personality_type\` — a one-word trait that best reflects the user's financial attitude or lifestyle pattern. 
        Also include a \`personality_definition\` that explains what the trait means in one short sentence.`;
};

async function getGeminiResponse(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const res = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(text, "text");
    return text || "⚠️ Gemini returned no output.";
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    return "⚠️ Failed to get a response from Gemini.";
  }
}

module.exports = {
  getPrompt,
  getGeminiResponse
}; 