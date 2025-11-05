const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { openai } = require('@ai-sdk/openai');
const { generateText, tool, stepCountIs } = require('ai');
const { z } = require('zod');
const OpenAI = require('openai');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
try {
  // Check if Firebase Admin is already initialized
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not found - running without Firestore');
    }
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
}

// Get Firestore instance (will be null if not initialized)
const db = admin.apps.length > 0 ? admin.firestore() : null;

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
**Detection**: User says "actually...", "wait...", "I only had...", "that was wrong", or corrects meal type

**REQUIRED WORKFLOW (FOLLOW THESE STEPS IN ORDER):**

**Step 1 - FIND THE MEAL (⚠️ NEVER SKIP THIS STEP):**
- **IMMEDIATELY call findRecentMeals tool** to search for recent meals
- **ALWAYS search ALL recent meals**: \`findRecentMeals({ limit: 10 })\`
- ⚠️ **You CANNOT call updateMeal without calling findRecentMeals first**
- If you skip this step, updateMeal will fail with an error
- Use conversation context to identify which meal the user is referring to
- Match by food names, timing, and context from previous messages

**CRITICAL: After calling findRecentMeals, you MUST:**
1. Describe what meals you found (meal type, time, foods, calories)
2. Identify which specific meal the user is referring to
3. Explain what change you'll make (with full updated macros)
4. Ask for explicit confirmation: "Should I make this change?"
5. ⚠️ **STOP HERE - DO NOT call updateMeal yet**

**Only proceed to Step 4 (updateMeal) after the user confirms in their next message.**

**EXAMPLE RESPONSE after finding meals:**
"I found your breakfast from 9:00 AM with 2 sunny side eggs (180 cal). I'll change this to be logged as lunch instead. Should I make this update?"

**Step 2 - IDENTIFY THE MEAL:**
From findRecentMeals results, identify which meal they're referring to:
- Match by meal type, time, and food names
- If only one meal found → that's the one
- If multiple found → ask which one (see below)

**Step 3 - CONFIRM THE CHANGE:**
**ALWAYS confirm before updating** and show FULL macros (calories, protein, carbs, fats, fiber):

**Calculation Rules:**
1. **Changing meal type ONLY**: Macros stay identical - confirm this to the user
2. **Changing quantity**: Multiply all macros by ratio (e.g., 1 egg ÷ 2 eggs = 0.5x all values)
3. **Adding items**: Show math - [existing] + [new] = [total] with full macro breakdown

**Example confirmation format:**
"Got it! I'll update your breakfast from 9:00 AM:
• From: 2 eggs (180 cal | 12g P, 1g C, 14g F, 0g Fb)
• To: 1 egg (90 cal | 6g P, 0.5g C, 7g F, 0g Fb)
Your daily total will change from 795 → 705 calories. Should I make this change?"

**Step 4 - UPDATE:**
Extract the meal ID from findRecentMeals results and pass it to updateMeal.

EXAMPLE:
If findRecentMeals returned: \`{ meals: [{ id: "meal_1730823456789_4aBcXyZ", mealType: "breakfast", foods: [...] }] }\`
Then call: \`updateMeal({ mealId: "meal_1730823456789_4aBcXyZ", foods: [...updated foods...] })\`

CRITICAL: Use the EXACT \`id\` value from the meal object returned by findRecentMeals.
DO NOT use placeholder IDs like "xyz789", "abc123", "12345", or "mealId_placeholder".
ONLY use real IDs from findRecentMeals results in the current conversation.

**If findRecentMeals returns NO results:**
"I don't see any [breakfast/lunch/dinner] logged recently. Would you like me to log this as a new [meal type] entry instead?"

**If findRecentMeals returns MULTIPLE matches:**
"I see you logged [food] multiple times today:
1. Lunch (1:00 PM) - 5oz chicken (450 cal)
2. Dinner (7:00 PM) - 4oz chicken (360 cal)
Which one are you correcting?"

**If no match found**:
"Hmm, I don't see pasta in your recent meals. When did you have it?"

### CONCRETE WORKFLOW EXAMPLES:

**Example 1 - Changing meal type:**
User: "Actually that was lunch not breakfast"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 sunny side eggs (140 cal | 12g P, 1g C, 10g F, 0g Fb). I'll change this to be logged as lunch instead. The macros will stay the same: 140 cal | 12g P, 1g C, 10g F, 0g Fb. Should I make this update?"
User: "Yes"
You: *Call updateMeal({ mealId: "abc123", mealType: "lunch" })*
You: "✅ Updated! Your meal is now logged as lunch."

**Example 2 - Changing quantity:**
User: "Wait I only had 1 egg not 2"
You: *Call findRecentMeals({ containsFood: "egg", limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 eggs (180 cal | 12g P, 2g C, 14g F, 0g Fb). I'll update this to 1 egg (90 cal | 6g P, 1g C, 7g F, 0g Fb). Should I make this change?"
User: "Yes please"
You: *Call updateMeal({ mealId: "abc123", foods: [{ name: "egg", quantity: "1 egg", calories: 90, protein: 6, carbs: 1, fats: 7, fiber: 0 }] })*
You: "✅ Updated! Your breakfast now shows 1 egg (90 cal | 6g P, 1g C, 7g F, 0g Fb)."

**Example 3 - Adding food to existing meal:**
User: "I also had toast with that"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 eggs (180 cal | 12g P, 2g C, 14g F, 0g Fb). I'll add 2 slices of toast (160 cal | 6g P, 30g C, 2g F, 2g Fb). Your breakfast total will become: 2 eggs (180 cal) + toast (160 cal) = 340 cal | 18g P, 32g C, 16g F, 2g Fb. Should I add this?"
User: "Yes"
You: *Call updateMeal({ mealId: "abc123", foods: [existing eggs, new toast] })*
You: "✅ Updated! Your breakfast now includes 2 eggs and 2 slices of toast (340 cal | 18g P, 32g C, 16g F, 2g Fb)."

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

### IMPORTANT: ALWAYS RESPOND AFTER CALLING TOOLS
After using ANY tool, you MUST generate a natural language response explaining what you did or found.
- After logMeal: Confirm what was logged with calorie breakdown
- After updateMeal: Confirm what was updated and show new values
- After findRecentMeals: Describe what you found and proceed with the edit
- NEVER call a tool and stay silent - always follow up with text

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

// Define tools for function calling (AI SDK v5 syntax with Zod)
const tools = {
  logMeal: tool({
    description: 'Log a new meal to the user\'s food diary. Use when user mentions eating food.',
    inputSchema: z.object({
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).describe('Type of meal'),
      foods: z.array(z.object({
        name: z.string().describe('Food name'),
        quantity: z.string().describe('Quantity with unit (e.g., "2 eggs", "1 cup")'),
        calories: z.number().describe('Calories'),
        protein: z.number().describe('Protein in grams'),
        carbs: z.number().describe('Carbs in grams'),
        fats: z.number().describe('Fats in grams'),
        fiber: z.number().describe('Fiber in grams'),
      })).describe('List of foods in the meal'),
      timestamp: z.string().describe('ISO timestamp of when meal was eaten'),
      notes: z.string().optional().describe('Optional notes about the meal'),
    }),
    execute: async ({ mealType, foods, timestamp, notes }, { abortSignal }) => {
      console.log('🔧 Executing logMeal tool');

      const userId = global.currentUserId || 'anonymous';

      // If Firestore is not available, fall back to mock
      if (!db) {
        console.warn('⚠️  Firestore not available, using mock database');
        const mealId = `meal_${Date.now()}`;
        if (!mockMealsDB[userId]) mockMealsDB[userId] = [];
        mockMealsDB[userId].push({ id: mealId, mealType, foods, timestamp, notes });
        console.log('✅ Meal logged to mock:', mealId);
        return { success: true, mealId, message: 'Meal logged successfully' };
      }

      try {
        // Calculate totals from foods array
        const totals = foods.reduce((acc, food) => ({
          calories: acc.calories + (food.calories || 0),
          protein: acc.protein + (food.protein || 0),
          carbs: acc.carbs + (food.carbs || 0),
          fats: acc.fats + (food.fats || 0),
          fiber: acc.fiber + (food.fiber || 0),
        }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

        // Create meal document
        const mealData = {
          mealType,
          timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
          foods,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          totalFiber: totals.fiber,
          photoUrl: null,
          photoUrls: [],
          notes: notes || '',
          loggedVia: 'chat',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const mealsRef = db.collection('nutrition').doc(userId).collection('meals');
        const docRef = await mealsRef.add(mealData);

        console.log('✅ Meal logged to Firestore:', docRef.id);
        return { success: true, mealId: docRef.id, message: 'Meal logged successfully' };
      } catch (error) {
        console.error('❌ Error logging meal to Firestore:', error);
        return { success: false, message: `Error: ${error.message}` };
      }
    },
  }),

  findRecentMeals: tool({
    description: 'Find recent meals for context. REQUIRED before calling updateMeal. Use when user references a previous meal or wants to edit. Returns actual meal IDs needed for updates.',
    inputSchema: z.object({
      containsFood: z.string().optional().describe('Search for meals containing this food item'),
      limit: z.number().optional().describe('Maximum number of meals to return (default: 10)'),
    }),
    execute: async ({ containsFood, limit }, { abortSignal }) => {
      console.log('🔧 Executing findRecentMeals tool');

      const userId = global.currentUserId || 'anonymous';

      // If Firestore is not available, fall back to mock
      if (!db) {
        console.warn('⚠️  Firestore not available, using mock database');
        const userMeals = mockMealsDB[userId] || [];
        const filtered = userMeals.filter(meal => {
          if (containsFood) {
            const hasFood = meal.foods.some(f =>
              f.name.toLowerCase().includes(containsFood.toLowerCase())
            );
            if (!hasFood) return false;
          }
          return true;
        }).slice(0, limit || 10);
        console.log(`✅ Found ${filtered.length} recent meals from mock`);
        return { meals: filtered };
      }

      try {
        const mealsRef = db.collection('nutrition').doc(userId).collection('meals');
        let query = mealsRef.orderBy('createdAt', 'desc').limit(limit || 10);

        const snapshot = await query.get();
        let meals = [];

        snapshot.forEach(doc => {
          const data = doc.data();

          // Apply containsFood filter if provided (client-side filtering)
          if (containsFood) {
            const hasFood = data.foods?.some(f =>
              f.name.toLowerCase().includes(containsFood.toLowerCase())
            );
            if (!hasFood) return; // Skip this meal
          }

          meals.push({
            id: doc.id,
            mealType: data.mealType,
            timestamp: data.timestamp?.toDate().toISOString() || data.createdAt?.toDate().toISOString(),
            foods: data.foods || [],
            totalCalories: data.totalCalories || 0,
            totalProtein: data.totalProtein || 0,
            totalCarbs: data.totalCarbs || 0,
            totalFats: data.totalFats || 0,
            totalFiber: data.totalFiber || 0,
            notes: data.notes || '',
          });
        });

        console.log(`✅ Found ${meals.length} recent meals from Firestore`);
        return { meals };
      } catch (error) {
        console.error('❌ Error finding meals in Firestore:', error);
        return { meals: [] };
      }
    },
  }),

  updateMeal: tool({
    description: 'Update an existing meal. CRITICAL: You MUST call findRecentMeals first to get the meal ID. NEVER use placeholder IDs. Only use IDs from findRecentMeals results.',
    inputSchema: z.object({
      mealId: z.string().describe('The meal ID from findRecentMeals (NEVER use placeholders like "xyz789" or "abc123")'),
      foods: z.array(z.object({
        name: z.string(),
        quantity: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fats: z.number(),
        fiber: z.number(),
      })).optional().describe('Updated foods array'),
      notes: z.string().optional().describe('Updated notes'),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional().describe('Updated meal type'),
    }),
    execute: async ({ mealId, foods, notes, mealType }, { abortSignal }) => {
      console.log('🔧 Executing updateMeal tool with mealId:', mealId);

      // VALIDATION: Reject known placeholder IDs
      const placeholders = ['xyz789', 'abc123', '12345', 'mealId_placeholder', 'meal_placeholder'];
      if (placeholders.includes(mealId)) {
        console.error('❌ REJECTED: AI used placeholder ID instead of calling findRecentMeals');
        return {
          success: false,
          message: 'ERROR: You must call findRecentMeals first to get the real meal ID. Never use placeholder IDs like "xyz789".'
        };
      }

      // VALIDATION: Check if ID looks like a real Firestore ID (min 10 chars)
      if (mealId.length < 10) {
        console.error('❌ REJECTED: Meal ID too short, likely a placeholder:', mealId);
        return {
          success: false,
          message: 'ERROR: Invalid meal ID. You must call findRecentMeals first to get the real meal ID.'
        };
      }

      const userId = global.currentUserId || 'anonymous';

      // If Firestore is not available, fall back to mock
      if (!db) {
        console.warn('⚠️  Firestore not available, using mock database');
        const userMealsList = mockMealsDB[userId] || [];
        const mealIndex = userMealsList.findIndex(m => m.id === mealId);

        if (mealIndex >= 0) {
          const updates = {};
          if (foods) updates.foods = foods;
          if (notes) updates.notes = notes;
          if (mealType) updates.mealType = mealType;

          userMealsList[mealIndex] = { ...userMealsList[mealIndex], ...updates };
          console.log('✅ Meal updated in mock:', mealId);
          return { success: true, message: 'Meal updated successfully' };
        }

        return { success: false, message: 'Meal not found' };
      }

      try {
        const mealRef = db.collection('nutrition').doc(userId).collection('meals').doc(mealId);
        const updates = {};

        // If foods array is updated, recalculate totals
        if (foods) {
          const totals = foods.reduce((acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fats: acc.fats + (food.fats || 0),
            fiber: acc.fiber + (food.fiber || 0),
          }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

          updates.foods = foods;
          updates.totalCalories = totals.calories;
          updates.totalProtein = totals.protein;
          updates.totalCarbs = totals.carbs;
          updates.totalFats = totals.fats;
          updates.totalFiber = totals.fiber;
        }

        if (notes !== undefined) {
          updates.notes = notes;
        }

        if (mealType !== undefined) {
          updates.mealType = mealType;
        }

        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await mealRef.update(updates);
        console.log('✅ Meal updated in Firestore:', mealId);
        return { success: true, message: 'Meal updated successfully' };
      } catch (error) {
        console.error('❌ Error updating meal in Firestore:', error);
        return { success: false, message: `Error: ${error.message}` };
      }
    },
  }),

  getDailySummary: tool({
    description: 'Get daily calorie summary and meals for a specific date.',
    inputSchema: z.object({
      date: z.string().describe('Date in YYYY-MM-DD format'),
    }),
    execute: async ({ date }, { abortSignal }) => {
      console.log('🔧 Executing getDailySummary tool');

      const userId = global.currentUserId || 'anonymous';

      // If Firestore is not available, fall back to mock
      if (!db) {
        console.warn('⚠️  Firestore not available, using mock database');
        const todayMeals = mockMealsDB[userId] || [];
        const total = todayMeals.reduce((sum, m) => {
          const mealCal = m.foods.reduce((s, f) => s + f.calories, 0);
          return sum + mealCal;
        }, 0);
        console.log('✅ Daily summary from mock:', total, 'calories');
        return {
          totalCalories: total,
          calorieTarget: 2400,
          progress: total / 2400,
          mealsCount: todayMeals.length,
        };
      }

      try {
        // Parse date and create start/end of day timestamps
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const mealsRef = db.collection('nutrition').doc(userId).collection('meals');
        const snapshot = await mealsRef
          .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
          .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
          .get();

        const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
        let mealsCount = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          totals.calories += data.totalCalories || 0;
          totals.protein += data.totalProtein || 0;
          totals.carbs += data.totalCarbs || 0;
          totals.fats += data.totalFats || 0;
          totals.fiber += data.totalFiber || 0;
          mealsCount++;
        });

        console.log('✅ Daily summary from Firestore:', totals.calories, 'calories');
        return {
          date,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          totalFiber: totals.fiber,
          calorieTarget: 2400,
          progress: Math.min(totals.calories / 2400, 1.0),
          mealsCount,
        };
      } catch (error) {
        console.error('❌ Error getting daily summary from Firestore:', error);
        return {
          totalCalories: 0,
          calorieTarget: 2400,
          progress: 0,
          mealsCount: 0,
        };
      }
    },
  }),
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

    // Set global userId for tool execution (AI SDK v5 tools need access to context)
    global.currentUserId = userId;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPromptWithContext,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      tools,
      maxSteps: 10, // Allow up to 10 steps per request (resets each message, not cumulative)
      toolChoice: 'auto', // Let AI decide when to use tools
      // In v5, tools execute automatically using their built-in execute functions
    });

    console.log('✅ AI request successful');

    // Extract message from response messages (handles tool calls properly)
    let message = result.text || ""; // Try simple case first

    // If no text in final result, extract from all assistant messages
    if (!message || !message.trim()) {
      message = result.response.messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => {
          // Handle string content
          if (typeof msg.content === 'string') {
            return msg.content;
          }
          // Handle array content (mixed text and tool calls)
          if (Array.isArray(msg.content)) {
            return msg.content
              .filter(part => part.type === 'text')
              .map(part => part.text)
              .join(' ');
          }
          return '';
        })
        .filter(text => text.trim())
        .join('\n');
    }

    // Context-aware fallback based on which tool was called
    if (!message || !message.trim()) {
      const toolCalls = result.steps?.flatMap(step => step.toolCalls || []) || [];
      const toolResults = result.steps?.flatMap(step => step.toolResults || []) || [];

      console.log('⚠️ AI called tools but generated no text. Providing fallback based on tool type.');

      if (toolCalls.some(tc => tc.toolName === 'logMeal')) {
        const logResult = toolResults.find(tr => tr.toolName === 'logMeal');
        if (logResult?.result?.success === false) {
          message = `❌ Failed to log meal: ${logResult.result.message}`;
        } else {
          message = "✅ Your meal has been logged!";
        }
      } else if (toolCalls.some(tc => tc.toolName === 'updateMeal')) {
        const updateResult = toolResults.find(tr => tr.toolName === 'updateMeal');
        if (updateResult?.result?.success === false) {
          message = `❌ Failed to update meal: ${updateResult.result.message}`;
        } else {
          message = "✅ Your meal has been updated!";
        }
      } else if (toolCalls.some(tc => tc.toolName === 'findRecentMeals')) {
        // AI searched for meals but didn't describe them - provide detailed fallback
        const findResult = toolResults.find(tr => tr.toolName === 'findRecentMeals');
        if (findResult?.result?.meals?.length > 0) {
          const meal = findResult.result.meals[0];
          const foodNames = meal.foods.map(f => f.name).join(', ');
          const timeStr = new Date(meal.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
          message = `I found your ${meal.mealType} from ${timeStr} with ${foodNames} (${meal.totalCalories} cal). What changes would you like me to make?`;
        } else {
          message = "I couldn't find any recent meals matching your request. Could you tell me more about when you ate or what foods you had?";
        }
      } else if (toolCalls.some(tc => tc.toolName === 'getDailySummary')) {
        const summaryResult = toolResults.find(tr => tr.toolName === 'getDailySummary');
        if (summaryResult?.result?.success === false) {
          message = `❌ Failed to get summary: ${summaryResult.result.message}`;
        } else if (summaryResult?.result) {
          message = `Your daily summary: ${summaryResult.result.totalCalories || 0} calories logged today.`;
        } else {
          message = "Here's your daily summary.";
        }
      } else {
        message = "✅ Done!";
      }
    }

    console.log('🤖 Generated response:', message.substring(0, 100) + '...');

    // Return response with any tool calls made
    res.json({
      message,
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