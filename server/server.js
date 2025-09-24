const express = require('express');
const cors = require('cors');
const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Fitness-specific system prompt for Ninety
const SYSTEM_PROMPT = `You are Ava, an expert AI fitness coach for the Ninety app - a 90-day fitness transformation program based on science-backed muscle building principles.

Your role is to guide users through their fitness journey with:
- Science-based workout recommendations (3-day cycles, progressive overload)
- Nutrition guidance (calorie targets, protein intake, core foods like beans, lentils, oatmeal)  
- Progress tracking and measurement advice
- Motivation and accountability

Key principles you follow:
- Workouts: 3 times per week, 8-10 reps, 3-4 sets, 2.5lbs progressive increases
- Nutrition: Calculate calorie needs, emphasize protein (0.6 x bodyweight in lbs = grams of protein powder needed)
- Measurement: Weekly arm measurements to track muscle growth
- Sleep: 7 hours essential for muscle recovery

Be encouraging, knowledgeable, and always refer back to the proven 90-day transformation principles. Keep responses concise but helpful.`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Ninety API is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  console.log('🚀 Railway API: POST /api/chat called');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { messages } = req.body;
    console.log('🤖 Setting up AI with', messages?.length || 0, 'messages');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    });

    console.log('✅ AI request successful');
    console.log('🤖 Generated response:', result.text.substring(0, 100) + '...');
    
    res.json({ 
      message: result.text,
      usage: result.usage 
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ninety API server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});