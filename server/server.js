const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI client for Whisper
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure multer for file uploads
// Configure multer with diskStorage to preserve file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Extract extension from original filename
    const ext = path.extname(file.originalname);
    // Generate unique filename with extension preserved
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    console.log('💾 Saving file as:', uniqueName);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,  // Use diskStorage instead of dest
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max)
  },
  fileFilter: (req, file, cb) => {
    // Debug logging to see what React Native sends
    console.log('🔍 fileFilter called with:');
    console.log('   mimetype:', file.mimetype);
    console.log('   originalname:', file.originalname);
    console.log('   fieldname:', file.fieldname);

    // Check file type
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/mp4', 'audio/x-m4a'];
    const allowedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];

    // More lenient validation for React Native uploads
    const hasValidMimeType = file.mimetype && allowedTypes.includes(file.mimetype);
    const hasValidExtension = file.originalname && allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    // Accept if either mimetype OR extension is valid, or if it's from the 'audio' field
    if (hasValidMimeType || hasValidExtension || file.fieldname === 'audio') {
      console.log('   ✅ File accepted');
      cb(null, true);
    } else {
      console.log('   ❌ File rejected');
      cb(new Error('Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm'));
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced food logging system prompt for Ninety
const SYSTEM_PROMPT = `You are Ava, an expert AI fitness coach for the Ninety app - a 90-day fitness transformation program.

Your role is to guide users through their fitness journey with:
- Nutrition logging and guidance (PRIMARY FOCUS)
- Science-based workout recommendations
- Progress tracking and measurement advice
- Motivation and accountability

## FOOD LOGGING INTELLIGENCE

### WHEN TO LOG MEALS:
- Past tense food mentions: "I had eggs", "just ate chicken", "finished lunch" → LOG IT
- Present continuous: "I'm eating breakfast" → LOG IT
- Future/planning: "I'll have pasta tomorrow", "thinking about food" → COACHING ONLY, DON'T LOG

You are smart enough to understand intent naturally. Trust your language understanding.

### LOGGING WORKFLOW:
1. **Detect meal event** from past tense or present continuous
2. **Identify meal type**: breakfast (5am-10am), lunch (11am-2pm), dinner (5pm-9pm), or snack (anytime)
3. **Extract foods and quantities**:
   - If user provides quantities ("2 eggs", "1 cup rice") → use them
   - If no quantities + no photo → ASK: "How much chicken? Small (3oz), Medium (5oz), or Large (7oz)?"
   - If photo provided → analyze portion sizes
4. **Estimate macros** for each food:
   - Calories (kcal)
   - Protein (g)
   - Carbs (g)
   - Fats (g)
   - Fiber (g) ← IMPORTANT: Track this!
5. **Confirm before logging**: Show breakdown, ask "Should I log this as [meal]?"
6. **Call logMeal tool** only after user confirms

### MULTIPLE ITEMS:
User: "I had eggs, toast, and coffee for breakfast"
→ Extract ALL items with quantities
→ Ask for missing quantities: "How many eggs? How many slices of toast?"
→ Show full breakdown before logging

### PHOTO LOGGING (Preferred):
- Photos help determine portions, oiliness, and ingredients
- If user logs without photo, gently remind: "💡 Quick tip: Photos help me see portions and cooking style for accurate tracking!"
- Don't nag, just one gentle reminder per session

### EDITING PREVIOUS MEALS:
**Detection**: User says "actually...", "wait...", "I only had...", "that was wrong"

**Process**:
1. Call findRecentMeals to get context (you'll see recent meals in system prompt)
2. Identify which meal they're referring to:
   - Use meal type ("breakfast")
   - Use food name ("the eggs")
   - Use time ("this morning")
3. **ALWAYS confirm before updating**:
   "Got it! I'll update your breakfast from 9:00 AM:
   • From: 2 eggs (180 cal)
   • To: 1 egg (90 cal)
   Your daily total will change from 795 → 705 calories. Should I make this change?"
4. Call updateMeal tool only after confirmation

**If ambiguous**:
"I see you logged chicken twice today:
1. Lunch (1:00 PM) - 5oz chicken
2. Dinner (7:00 PM) - 4oz chicken
Which one are you correcting?"

**If no match found**:
"Hmm, I don't see pasta in your recent meals. When did you have it?"

### MACROS TO SHOW:
Always display: Calories | Protein (P) | Carbs (C) | Fats (F) | Fiber (Fb)
Example: "450 cal | P: 42g C: 48g F: 8g Fb: 3g"

### CALORIE TARGET:
Default: 2,400 calories/day (will be customized during onboarding)

### KEY PRINCIPLES:
- Be conversational and encouraging
- Confirm before logging or editing
- Show detailed breakdowns
- Celebrate progress: "You're at 780 / 2,400 calories today! 💪"
- Keep responses concise but complete

### TOOLS AVAILABLE:
- logMeal: Log a new meal (use after confirmation)
- findRecentMeals: Find meals for editing context
- updateMeal: Update existing meal (use after confirmation)
- getDailySummary: Get today's calorie totals

Trust your intelligence to detect intent naturally. Don't overthink - you're smart enough to understand when someone ate vs. will eat.`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Ninety API is running!', 
    timestamp: new Date().toISOString() 
  });
});

// Voice transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  console.log('🎙️ Railway API: POST /api/transcribe called');
  
  let tempFilePath = null;
  
  try {
    // Debug: Log the entire req.file object to diagnose issues
    console.log('📦 req.file received:', JSON.stringify(req.file, null, 2));

    if (!req.file) {
      console.error('❌ No file received in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    tempFilePath = req.file.path;
    console.log('📁 Uploaded file:', req.file.originalname);
    console.log('📊 File size:', (req.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

    // Create a read stream for the uploaded file
    const audioFile = fs.createReadStream(tempFilePath);

    // Transcribe using OpenAI Whisper
    console.log('🎵 Starting transcription with Whisper...');
    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'gpt-4o-mini-transcribe', // Use the latest model for better quality
      response_format: 'text',
      prompt: 'The following is a conversation about fitness, workouts, nutrition, and health-related topics.',
    });

    console.log('✅ Transcription successful');
    console.log('📝 Transcribed text:', transcription.substring(0, 100) + '...');

    res.json({
      transcription: transcription,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
    });

  } catch (error) {
    console.error('❌ Transcription error:', error);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message,
    });
  } finally {
    // Clean up: delete the temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('🗑️ Cleaned up temporary file:', tempFilePath);
      } catch (cleanupError) {
        console.error('⚠️ Failed to cleanup file:', cleanupError.message);
      }
    }
  }
});

// Mock database for demo (in production, this would be Firestore)
const mockMealsDB = {};

// Define tools for function calling
const tools = {
  logMeal: {
    description: 'Log a new meal to the user\'s food diary. Use when user mentions eating food.',
    parameters: {
      type: 'object',
      properties: {
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Type of meal',
        },
        foods: {
          type: 'array',
          description: 'List of foods in the meal',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Food name' },
              quantity: { type: 'string', description: 'Quantity with unit (e.g., "2 eggs", "1 cup")' },
              calories: { type: 'number', description: 'Calories' },
              protein: { type: 'number', description: 'Protein in grams' },
              carbs: { type: 'number', description: 'Carbs in grams' },
              fats: { type: 'number', description: 'Fats in grams' },
              fiber: { type: 'number', description: 'Fiber in grams' },
            },
            required: ['name', 'quantity', 'calories', 'protein', 'carbs', 'fats', 'fiber'],
          },
        },
        timestamp: {
          type: 'string',
          description: 'ISO timestamp of when meal was eaten',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the meal',
        },
      },
      required: ['mealType', 'foods', 'timestamp'],
    },
  },

  findRecentMeals: {
    description: 'Find recent meals for context. Use when user references a previous meal or when editing.',
    parameters: {
      type: 'object',
      properties: {
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Filter by meal type',
        },
        containsFood: {
          type: 'string',
          description: 'Search for meals containing this food item',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of meals to return (default: 10)',
        },
      },
    },
  },

  updateMeal: {
    description: 'Update an existing meal. Use when user corrects or adjusts a previous meal.',
    parameters: {
      type: 'object',
      properties: {
        mealId: {
          type: 'string',
          description: 'The meal ID to update (from findRecentMeals)',
        },
        foods: {
          type: 'array',
          description: 'Updated foods array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'string' },
              calories: { type: 'number' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fats: { type: 'number' },
              fiber: { type: 'number' },
            },
          },
        },
        notes: {
          type: 'string',
          description: 'Updated notes',
        },
      },
      required: ['mealId'],
    },
  },

  getDailySummary: {
    description: 'Get daily calorie summary and meals for a specific date.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
      },
      required: ['date'],
    },
  },
};

// Chat endpoint with function calling
app.post('/api/chat', async (req, res) => {
  console.log('🚀 Railway API: POST /api/chat called');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { messages, userId, recentMealsContext } = req.body;
    console.log('🤖 Setting up AI with', messages?.length || 0, 'messages');
    console.log('👤 User ID:', userId);
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build system prompt with recent meals context
    let systemPromptWithContext = SYSTEM_PROMPT;
    if (recentMealsContext && recentMealsContext.length > 0) {
      systemPromptWithContext += '\n\nRECENT MEALS (for context when editing):\n';
      recentMealsContext.forEach((meal, idx) => {
        const foodNames = meal.foods.map(f => f.name).join(', ');
        const timeStr = new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        systemPromptWithContext += `${idx + 1}. ${meal.mealType.toUpperCase()} at ${timeStr} - ${foodNames} (${meal.totalCalories} cal) [meal_id: ${meal.id}]\n`;
      });
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPromptWithContext,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      tools,
      maxSteps: 5, // Allow up to 5 tool call iterations
      toolChoice: 'auto', // Let AI decide when to use tools
      // Tool execution happens automatically by AI SDK
      execute: async (tool, args) => {
        console.log(`🔧 Executing tool: ${tool.name}`, args);

        // In production, these would call Firestore via nutritionService
        // For now, we'll mock the responses
        switch (tool.name) {
          case 'logMeal':
            // Mock meal logging
            const mealId = `meal_${Date.now()}`;
            if (!mockMealsDB[userId]) mockMealsDB[userId] = [];
            mockMealsDB[userId].push({ id: mealId, ...args });
            console.log('✅ Meal logged:', mealId);
            return { success: true, mealId, message: 'Meal logged successfully' };

          case 'findRecentMeals':
            // Return mock meals or empty array
            const userMeals = mockMealsDB[userId] || [];
            const filtered = userMeals.filter(meal => {
              if (args.mealType && meal.mealType !== args.mealType) return false;
              if (args.containsFood) {
                const hasFood = meal.foods.some(f =>
                  f.name.toLowerCase().includes(args.containsFood.toLowerCase())
                );
                if (!hasFood) return false;
              }
              return true;
            }).slice(0, args.limit || 10);
            console.log(`✅ Found ${filtered.length} recent meals`);
            return { meals: filtered };

          case 'updateMeal':
            // Mock meal update
            const userMealsList = mockMealsDB[userId] || [];
            const mealIndex = userMealsList.findIndex(m => m.id === args.mealId);
            if (mealIndex >= 0) {
              userMealsList[mealIndex] = { ...userMealsList[mealIndex], ...args };
              console.log('✅ Meal updated:', args.mealId);
              return { success: true, message: 'Meal updated successfully' };
            }
            return { success: false, message: 'Meal not found' };

          case 'getDailySummary':
            // Mock daily summary
            const todayMeals = mockMealsDB[userId] || [];
            const total = todayMeals.reduce((sum, m) => {
              const mealCal = m.foods.reduce((s, f) => s + f.calories, 0);
              return sum + mealCal;
            }, 0);
            console.log('✅ Daily summary:', total, 'calories');
            return {
              totalCalories: total,
              calorieTarget: 2400,
              progress: total / 2400,
              mealsCount: todayMeals.length,
            };

          default:
            return { error: 'Unknown tool' };
        }
      },
    });

    console.log('✅ AI request successful');
    console.log('🤖 Generated response:', result.text.substring(0, 100) + '...');

    // Return response with any tool calls made
    res.json({
      message: result.text,
      usage: result.usage,
      toolCalls: result.steps?.filter(step => step.toolCalls).flatMap(step => step.toolCalls) || [],
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