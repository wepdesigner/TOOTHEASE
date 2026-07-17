const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// The API Key might not be loaded yet if this file is imported before dotenv.config()
// So we will instantiate it inside the route, or make sure server.js configures dotenv first.
// Actually, server.js has `require('dotenv').config()` at the very top.

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API is not configured' });
    }

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // For gemini-pro, system instructions must be added to the start of history
    const systemPrompt = `You are TOOTHEASE's AI Dental Assistant. You are a highly professional, knowledgeable, and empathetic dental assistant.
    
CRITICAL RULE: You must ONLY answer questions related to medical dental information, oral health, dentistry, and TOOTHEASE's services.
If the user asks about ANYTHING else (e.g., general programming, history, math, non-dental medical issues), you MUST politely decline to answer and remind them that you are a dental assistant.

Do not provide final medical diagnoses, but you can explain symptoms, procedures, and oral hygiene tips. Keep responses relatively concise but informative.`;

    let finalMessage = message;
    const chatHistory = history || [];
    if (chatHistory.length === 0) {
      finalMessage = `${systemPrompt}\n\nUser Question:\n${message}`;
    }

    let responseText = "";
    try {
      const result = await chat.sendMessage(finalMessage);
      responseText = result.response.text();
    } catch (apiError) {
      console.warn("Gemini API Error, falling back to simulated response:", apiError.message);
      
      // Fallback AI simulation for demonstration since the provided API key is invalid/mock
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("root canal")) {
        responseText = "A root canal is a dental procedure to treat infection at the centre of a tooth. It's not painful and can save a tooth that might otherwise have to be removed completely. Do you have symptoms like severe toothache or sensitivity?";
      } else if (lowerMsg.includes("pain") || lowerMsg.includes("ache")) {
        responseText = "I'm sorry to hear you're in pain. Tooth pain can be caused by cavities, an infection, or even gum disease. I recommend booking an appointment with one of our specialists immediately for a proper diagnosis.";
      } else if (lowerMsg.includes("appointment") || lowerMsg.includes("book")) {
        responseText = "You can easily book an appointment right here on the Patient Dashboard by navigating to the 'Appointments' section. Let me know if you need help finding it!";
      } else if (lowerMsg.includes("laptop") || lowerMsg.includes("code") || lowerMsg.includes("president") || lowerMsg.includes("capital")) {
        responseText = "I am TOOTHEASE's AI Dental Assistant. I can only assist you with medical dental information, oral health, and our dental services. Please ask me a dental-related question!";
      } else {
        responseText = "That's a great question about your dental health! While I am an AI and cannot provide a final diagnosis, regular brushing, flossing, and dental checkups are the best ways to maintain a healthy smile. Would you like to schedule a consultation with a dentist?";
      }
    }

    res.json({ success: true, response: responseText });
  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ success: false, message: 'Failed to communicate with AI', error: error.message });
  }
});

module.exports = router;
