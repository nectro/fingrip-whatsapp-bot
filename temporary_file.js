const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios')
const { ocrSpace } = require('ocr-space-api-wrapper');

const GEMINI_API_KEY = "AIzaSyAp4cRu-k8op_ND7mJ1UcluDOf6GPhrNpg";

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
    return text || "⚠️ Gemini returned no output.";
  } catch (error) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    return "⚠️ Failed to get a response from Gemini.";
  }
}

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
        Also include a \`personality_definition\` that explains what the trait means in one short sentence. 
        Examples:
        - **Resilient** → Doesn't give up easily when sticking to financial plans.
        - **Frugal** → Extremely money-conscious and avoids unnecessary expenses.
        - **Sociable** → Likely to spend more on outings and social life.
        - **Spontaneous** → Makes impulsive decisions around money or budgeting.
    `
}

const app = express();
const port = process.env.PORT || 3000;

// WhatsApp client setup
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Onboarding flow setup
const userStates = {};

const onboardingQuestions = [
  {
    key: 'wakeTime',
    text: `1️⃣ 🕐 You usually start your day around...\n\n1. Before 6 AM 🕕\n2. 6–8 AM 🌅\n3. 8–10 AM ☀️\n4. After 10 AM 😴\n\n[_Note: reply with a number 1-4_]`,
    optionsMap: {
      "1": "Before 6 AM 🕕",
      "2": "6–8 AM 🌅",
      "3": "8–10 AM ☀️",
      "4": "After 10 AM 😴",
    },
  },
  {
    key: 'status',
    text: `2️⃣ 🎯 Right now, you’re mostly...\n\n1. Working full-time 💼\n2. Studying 📚\n3. Freelancing 🎨\n4. Exploring options 🔍`,
    optionsMap: {
      "1": "Working full-time 💼",
      "2": "Studying 📚",
      "3": "Freelancing 🎨",
      "4": "Exploring options 🔍",
    },
  },
  {
    key: 'cityType',
    text: `3️⃣ 🌍 Which best describes your city?\n\n1. Metro 🏙️\n2. Tier 2/3 Town 🏠\n3. Small town 🌾\n4. Rural 🛣️`,
    optionsMap: {
      "1": "Metro 🏙️",
      "2": "Tier 2/3 Town 🏠",
      "3": "Small town 🌾",
      "4": "Rural 🛣️",
    },
  },
  {
    key: 'moneyFlow',
    text: `4️⃣ 💸 Your monthly money flow feels like...\n\n1. ₹0–15K – “Barely scraping by 🧃”\n2. ₹15K–25K – “Making it work 💪”\n3. ₹25K–40K – “Sorted, mostly ☕”\n4. ₹40K–60K – “Comfortable pace 🚶‍♂️”\n5. ₹60K–90K – “Smooth ride 🚙”\n6. ₹90K+ – “Cruisin’ on autopilot 🛳️”`,
    optionsMap: {
      "1": "₹0–15K – “Barely scraping by 🧃”",
      "2": "₹15K–25K – “Making it work 💪”",
      "3": "₹25K–40K – “Sorted, mostly ☕”",
      "4": "₹40K–60K – “Comfortable pace 🚶‍♂️”",
      "5": "₹60K–90K – “Smooth ride 🚙”",
      "6": "₹90K+ – “Cruisin’ on autopilot 🛳️”",
    },
  },
  {
    key: 'living',
    text: `5️⃣ 🏠 Living situation looking like...\n\n1. With family (no rent) 🏨\n2. Sharing a flat 🏠\n3. Living solo in a rental 🏢\n4. Paying for own house 🏡`,
    optionsMap: {
      "1": "With family (no rent) 🏨",
      "2": "Sharing a flat 🏠",
      "3": "Living solo in a rental 🏢",
      "4": "Paying for own house 🏡",
    },
  },
  {
    key: 'monthlyBurn',
    text: `6️⃣ 🔥 Rent + tiffin + subscriptions together feel like...\n\n1. ₹0–10K – “Just the basics 🧺”\n2. ₹10K–25K – “Standard setup 🪑”\n3. ₹25K–50K – “Comfy life 🛋️”\n4. ₹50K+ – “Premium living 🏰”`,
    optionsMap: {
      "1": "₹0–10K – “Just the basics 🧺”",
      "2": "₹10K–25K – “Standard setup 🪑”",
      "3": "₹25K–50K – “Comfy life 🛋️”",
      "4": "₹50K+ – “Premium living 🏰”",
    },
  },
  {
    key: 'surprise1000',
    text: `7️⃣ 🧠 You get an unexpected ₹1,000. You...\n\n1. Order food or shop 🍔🛍️\n2. Save or invest it 💹\n3. Clear a due 📤\n4. Buy something useful`,
    optionsMap: {
      "1": "Order food or shop 🍔🛍️",
      "2": "Save or invest it 💹",
      "3": "Clear a due 📤",
      "4": "Buy something useful",
    },
  },
];

// QR Code event
client.on('qr', (qr) => {
  console.log('📲 Scan this QR code with your WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp bot is ready!');
});

// Message event
client.on('message', async (msg) => {
  const userId = msg.from;

  if (!userStates[userId] && ["hii", "hey", "hello", "hi"].includes(msg.body.trim().toLowerCase())) {
    userStates[userId] = {
      step: 0,
      answers: {},
    };
    const welcomeMessage = `👋 Hey! Welcome to *FinGrip* — your smart money wingman.\n\nNo boring budgets. No guilt trips.\nJust chill vibes + clever nudges to keep your cash in check. 🧠💸\n\nWe get your flow, learn your style, and help you *spend smarter* — without killing the fun. 😎\n\nFirst, let’s get to know you a bit 👇\n\n${onboardingQuestions[0].text}`;
    await msg.reply(welcomeMessage);
    return;
  } else if (!!userStates[userId]) {
    // If the user has already started onboarding, process the response
    const user = userStates[userId];
    if (user.step < onboardingQuestions.length) {
      const currentQ = onboardingQuestions[user.step];
      const answer = msg.body.trim();
  
      // Ensure the message is valid before proceeding
      if (currentQ.optionsMap[answer]) {
        user.answers[currentQ.key] = answer;
        user.step++;
  
        // Check if there are more questions to ask
        if (user.step < onboardingQuestions.length) {
          await client.sendMessage(msg.from, onboardingQuestions[user.step].text);
        } else {
          let summary = `🎉 You're all set! Here's what you shared:\n\n`;
          for (const q of onboardingQuestions) {
            const selected = user.answers[q.key];
            const finalAnswer = q.optionsMap?.[selected.trim()] || selected;
            summary += `• *${q.key}*: ${finalAnswer}\n`;
          }
          // await msg.reply(summary);

          // Construct user profile for Gemini prompt
          const profile = onboardingQuestions.map(q => {
            const selected = user.answers[q.key];
            const finalAnswer = q.optionsMap?.[selected.trim()] || selected;
            return `- ${q.key}: ${finalAnswer}`;
          }).join('\n');

          const geminiPrompt = getPrompt(profile);
          // console.log(geminiPrompt)

          await client.sendMessage(msg.from, "🔍 Analyzing... Please wait...");

          const response = await getGeminiResponse(geminiPrompt);
          // console.log(response)

          // console.log(JSON.parse(response.replace(/```json|```/g, "").trim()))

          // Parse the Gemini response to get the weekly_budget
          let geminiData;
          try {
            geminiData = JSON.parse(response.replace(/```json|```/g, "").trim());
            console.log(geminiData)
          } catch (error) {
            console.error("Error parsing Gemini response:", error);
            geminiData = {};
          }

          const weeklyBudget = geminiData?.weekly_budget || "⚠️ Failed to retrieve weekly budget.";

          // Send the summary with the weekly_budget at the end
          summary += `\n\n💰 *Your Personalized Smart Spending Week* 🗓️:\nPowered by your insights! 💡✨\n`;
          summary += `• Monday: ₹${weeklyBudget.Monday} – Start the week strong! 💪\n`;
          summary += `• Tuesday: ₹${weeklyBudget.Tuesday} – Keep things steady 🏃‍♂️\n`;
          summary += `• Wednesday: ₹${weeklyBudget.Wednesday} – Midweek momentum 🔄\n`;
          summary += `• Thursday: ₹${weeklyBudget.Thursday} – Almost there! 🔥\n`;
          summary += `• Friday: ₹${weeklyBudget.Friday} – Time to unwind a bit 💸\n`;
          summary += `• Saturday: ₹${weeklyBudget.Saturday} – Enjoy your weekend! 🎉\n`;
          summary += `• Sunday: ₹${weeklyBudget.Sunday} – Relax and recharge ✨\n`;


          summary += `\n\n🚀 *Pro Tip:* Made a GPay payment? Just hit *Share* on the receipt & send it here. I’ll do the rest. 💡💰`;

          // Specify the image path (demo.png is in the same folder as index.js)
          const imagePath = path.join(__dirname, 'demo.png');
          const media = new MessageMedia('image/png', fs.readFileSync(imagePath).toString('base64'), 'demo.png');

          // Send the summary with the image in the same reply
          await client.sendMessage(msg.from, summary);
          // await msg.reply(media);
          await client.sendMessage(msg.from, media);
        }
      } else {
        await msg.reply(`❌ Please answer with a valid option. For example: 1, 2, 3, or 4.`);
        return;
      }
    }else {
      // 🔵 Media (OCR) flow – do not modify
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          const filePath = path.join(__dirname, 'temp_image.jpg');
          fs.writeFileSync(filePath, media.data, 'base64');
    
          const processedPath = path.join(__dirname, 'processed_image.jpg');
          await sharp(filePath)
            .resize({ width: 1000 })
            .greyscale()
            .normalize()
            .toFile(processedPath);
    
          const result = await ocrSpace(processedPath, {
            apiKey: 'K89958106988957',
            language: 'eng',
            isOverlayRequired: false,
          });
    
          const extractedText = result.ParsedResults?.[0]?.ParsedText || '';
          console.log('📄 OCR Text:', extractedText);
    
          const amountMatch = extractedText.match(/[₹RsINR*?]{0,3}\s?[\d]{1,3}(?:[,.\d]{0,10})/i);
    
          if (amountMatch) {
            await msg.reply(`💰 Detected transaction amount: ${amountMatch[0].replace("*", "")}`);
          } else {
            await msg.reply(`😓 Couldn't detect any clear transaction amount from the image.`);
          }
    
          fs.unlinkSync(filePath);
          fs.unlinkSync(processedPath);
    
        } catch (error) {
          console.error('OCR Error:', error);
          await msg.reply('⚠️ OCR failed. Please try again.');
        }
      } else {
        // make an interesting conversations like did you do any expense in the last one hour?.
        await msg.reply("📸 Send me a screenshot of your transaction, and I'll try to read the amount from it!");
      }
    }
  }
});

// Start services
client.initialize();

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
