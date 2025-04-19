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
    text: `2️⃣ 🎯 Right now, you're mostly...\n\n1. Working full-time 💼\n2. Studying 📚\n3. Freelancing 🎨\n4. Exploring options 🔍`,
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
    text: `4️⃣ 💸 Your monthly money flow feels like...\n\n1. ₹0–15K – "Barely scraping by 🧃"\n2. ₹15K–25K – "Making it work 💪"\n3. ₹25K–40K – "Sorted, mostly ☕"\n4. ₹40K–60K – "Comfortable pace 🚶‍♂️"\n5. ₹60K–90K – "Smooth ride 🚙"\n6. ₹90K+ – "Cruisin' on autopilot 🛳️"`,
    optionsMap: {
      "1": "₹0–15K – 'Barely scraping by 🧃'",
      "2": "₹15K–25K – 'Making it work 💪'",
      "3": "₹25K–40K – 'Sorted, mostly ☕'",
      "4": "₹40K–60K – 'Comfortable pace 🚶‍♂️'",
      "5": "₹60K–90K – 'Smooth ride 🚙'",
      "6": "₹90K+ – 'Cruisin' on autopilot 🛳️'",
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
    text: `6️⃣ 🔥 Rent + tiffin + subscriptions together feel like...\n\n1. ₹0–10K – "Just the basics 🧺"\n2. ₹10K–25K – "Standard setup 🪑"\n3. ₹25K–50K – "Comfy life 🛋️"\n4. ₹50K+ – "Premium living 🏰"`,
    optionsMap: {
      "1": "₹0–10K – 'Just the basics 🧺'",
      "2": "₹10K–25K – 'Standard setup 🪑'",
      "3": "₹25K–50K – 'Comfy life 🛋️'",
      "4": "₹50K+ – 'Premium living 🏰'",
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

module.exports = onboardingQuestions; 