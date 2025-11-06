/*
 * ================================================================================
 * NINETY FITNESS APP - BACKEND API SERVER
 * ================================================================================
 *
 * This server handles all AI chat interactions and food logging for the Ninety app.
 *
 * MAIN RESPONSIBILITIES:
 * 1. Receive chat messages from the mobile app
 * 2. Use OpenAI GPT-4 to generate intelligent responses
 * 3. Allow AI to call "tools" (functions) to log meals, find recent meals, etc.
 * 4. Store meal data in Firebase Firestore database
 * 5. Transcribe voice recordings to text using OpenAI Whisper
 *
 * TECHNOLOGY STACK:
 * - Express: Web server framework
 * - Vercel AI SDK: Handles AI chat with tool calling
 * - OpenAI GPT-4: The AI brain that understands user messages
 * - Firebase Firestore: Database to store meal data
 * - OpenAI Whisper: Converts voice recordings to text
 *
 * ================================================================================
 */

// Import required libraries
const express = require("express"); // Web server framework

const cors = require("cors"); // Allow mobile app to make requests to this server

const multer = require("multer"); // Handle file uploads (for voice recordings)

const fs = require("fs"); // File system operations (create/delete files)

const path = require("path"); // Handle file paths

const { anthropic } = require("@ai-sdk/anthropic"); // Anthropic Claude integration for Vercel AI SDK

const { generateText, tool, stepCountIs } = require("ai"); // Vercel AI SDK for chat with tools
const { z } = require("zod"); // Schema validation library
const OpenAI = require("openai"); // OpenAI client for Whisper transcription
const admin = require("firebase-admin"); // Firebase Admin SDK for Firestore

// Create the Express web server
const app = express();

// Set the port number (Railway provides PORT, otherwise use 3000)
const PORT = process.env.PORT || 3000;

/*
 * ================================================================================
 * FIREBASE INITIALIZATION
 * ================================================================================
 *
 * Firebase Firestore is our database where we store:
 * - User meal logs (what they ate, calories, macros)
 * - User profiles
 * - Chat history
 *
 * The service account credentials are stored as an environment variable (FIREBASE_SERVICE_ACCOUNT)
 * in Railway. This allows the server to read/write to Firestore on behalf of users.
 *
 * ================================================================================
 */

// Try to initialize Firebase Admin SDK
try {
  // Check if Firebase Admin has already been initialized
  // (prevents errors if this code runs multiple times)
  if (!admin.apps.length) {
    // Get the Firebase service account credentials from environment variable
    // Railway stores this as a JSON string, so we parse it
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    // If we have valid credentials, initialize Firebase
    if (serviceAccount) {
      // Initialize Firebase Admin with the service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("🔥 Firebase Admin initialized successfully");
    } else {
      // No credentials found - log a warning
      // NOTE: This should NEVER happen in production!
      console.warn(
        "⚠️  FIREBASE_SERVICE_ACCOUNT not found - running without Firestore"
      );
    }
  }
} catch (error) {
  // If initialization fails, log the error
  console.error(
    "❌ Error initializing Firebase Admin:",
    error.message
  );
}

// Get a reference to the Firestore database
// If Firebase wasn't initialized, db will be null
// NOTE: All tool functions check if db is null before using it
const db = admin.apps.length > 0 ? admin.firestore() : null;

/*
 * ================================================================================
 * OPENAI CLIENT INITIALIZATION
 * ================================================================================
 *
 * We use OpenAI for two things:
 * 1. GPT-4: Generate intelligent chat responses (via Vercel AI SDK)
 * 2. Whisper: Transcribe voice recordings to text (via OpenAI client)
 *
 * This client is specifically for Whisper transcription.
 * The GPT-4 integration uses the Vercel AI SDK (imported above).
 *
 * ================================================================================
 */

// Create OpenAI client for Whisper transcription
// The API key is stored as an environment variable in Railway
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
 * ================================================================================
 * HELPER FUNCTION: identifyMealFromContext
 * ================================================================================
 *
 * PURPOSE:
 * After findRecentMeals returns meals, we need a SECOND AI analysis to identify
 * which specific meal the user is referring to based on conversation context.
 *
 * WHY THIS IS NEEDED:
 * The primary AI call with tool execution generates EMPTY TEXT after calling
 * findRecentMeals. This is a workflow design issue - we're asking one AI call
 * to do too much:
 * 1. Call findRecentMeals
 * 2. Analyze which meal user means
 * 3. Generate response describing the meal
 * 4. Ask for confirmation
 *
 * This helper splits that into TWO separate AI calls:
 * - First call: findRecentMeals (tool calling)
 * - Second call: identifyMealFromContext (analysis only, no tools)
 *
 * PARAMETERS:
 * - meals: Array of meals from findRecentMeals
 * - conversationHistory: Recent messages for context
 * - userIntent: The user's latest message that triggered the update
 *
 * RETURNS:
 * {
 *   mealId: string,           // The Firestore document ID
 *   mealType: string,         // breakfast/lunch/dinner/snack
 *   confidence: string,       // high/medium/low
 *   reasoning: string,        // Why AI chose this meal
 *   suggestedResponse: string // Response to send to user
 * }
 *
 * EXAMPLE:
 * User: "Actually that was lunch not breakfast"
 * conversationHistory: [
 *   {role: "user", content: "I had 2 sunny side eggs"},
 *   {role: "assistant", content: "Logged breakfast..."},
 *   {role: "user", content: "Actually that was lunch not breakfast"}
 * ]
 * meals: [{id: "abc123", mealType: "breakfast", foods: [{name: "Sunny Side Eggs", ...}], ...}]
 *
 * Returns: {
 *   mealId: "abc123",
 *   mealType: "breakfast",
 *   confidence: "high",
 *   reasoning: "User logged eggs breakfast 2 minutes ago, now saying 'that was lunch'",
 *   suggestedResponse: "I found your breakfast from 9:00 AM with 2 sunny side eggs..."
 * }
 *
 * ================================================================================
 */
async function identifyMealFromContext(
  meals,
  conversationHistory,
  userIntent
) {
  console.log("🔍 Starting meal identification analysis...");
  console.log(
    `📊 Analyzing ${meals.length} meals against user intent: "${userIntent}"`
  );

  // If no meals found, return null
  if (!meals || meals.length === 0) {
    console.log("⚠️ No meals to analyze");
    return null;
  }

  // If only one meal, high confidence it's that one
  if (meals.length === 1) {
    console.log("✅ Only one meal found - high confidence match");
    const meal = meals[0];
    const foodNames = meal.foods.map((f) => f.name).join(", ");
    const timeStr = new Date(meal.timestamp).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

    return {
      mealId: meal.id,
      mealType: meal.mealType,
      confidence: "high",
      reasoning: "Only one recent meal found",
      suggestedResponse: `I found your ${meal.mealType} from ${timeStr} with ${foodNames} (${meal.totalCalories} cal, ${meal.totalProtein}g protein, ${meal.totalCarbs}g carbs, ${meal.totalFats}g fat). What changes would you like me to make?`,
    };
  }

  // Multiple meals - need AI to analyze context
  console.log(
    "🤖 Multiple meals found - using AI to identify which one"
  );

  // Build the analysis prompt
  const analysisPrompt = `You are a meal identification assistant. Your job is to identify which specific meal the user is referring to based on conversation context.

CONVERSATION HISTORY:
${conversationHistory
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

USER'S CURRENT REQUEST:
"${userIntent}"

AVAILABLE MEALS (most recent first):
${meals
  .map((meal, idx) => {
    const foodNames = meal.foods.map((f) => f.name).join(", ");
    const timeStr = new Date(meal.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${idx + 1}. [ID: ${meal.id}]
   - Type: ${meal.mealType}
   - Time: ${timeStr}
   - Foods: ${foodNames}
   - Calories: ${meal.totalCalories}
   - Macros: ${meal.totalProtein}g protein, ${
      meal.totalCarbs
    }g carbs, ${meal.totalFats}g fat`;
  })
  .join("\n\n")}

TASK:
Analyze the conversation and identify which meal the user is referring to. Consider:
1. Temporal context ("that", "my breakfast", "what I just logged")
2. Food mentions in conversation
3. Meal type mentions
4. Recency (users usually refer to most recent meal when saying "that")

Respond with a JSON object (wrapped in \`\`\`json code fence) containing:
{
  "mealId": "<the Firestore document ID>",
  "mealType": "<breakfast/lunch/dinner/snack>",
  "confidence": "<high/medium/low>",
  "reasoning": "<1-2 sentences explaining why you chose this meal>",
  "suggestedResponse": "<What to say to user - describe the meal and ask what changes they want>"
}

IMPORTANT:
- Use ONLY the meal IDs provided above (like "abc123", not placeholders)
- If confidence is low, suggestedResponse should ask for clarification
- Include full meal details in suggestedResponse (time, foods, macros)`;

  try {
    // Make the AI call
    const result = await generateText({
      model: anthropic("claude-sonnet-4-5"),
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.2, // Low temperature for more consistent analysis
    });

    console.log("✅ AI meal identification complete");

    // Extract JSON from response
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      console.error("❌ No JSON found in AI response");
      console.log("📊 AI response:", result.text);
      return null;
    }

    const identification = JSON.parse(jsonMatch[1]);
    console.log("📊 Identified meal:", identification.mealId);
    console.log("📊 Confidence:", identification.confidence);
    console.log("📊 Reasoning:", identification.reasoning);

    return identification;
  } catch (error) {
    console.error("❌ Error in meal identification:", error);
    return null;
  }
}

/*
 * ================================================================================
 * HELPER FUNCTION: isPendingActionValid
 * ================================================================================
 *
 * PURPOSE:
 * Validates that a pendingAction is still usable (not expired, has required fields).
 *
 * WHY THIS IS NEEDED:
 * When a meal is identified in Turn 1, we create a pendingAction with the mealId.
 * Before executing it in Turn 2, we need to verify:
 * - It exists and has required fields (mealId, type, updateRequest)
 * - It hasn't expired (5 minute timeout)
 *
 * PARAMETERS:
 * - pendingAction: Object with { type, mealId, updateRequest, expiresAt }
 *
 * RETURNS:
 * - true if valid and not expired
 * - false otherwise
 *
 * ================================================================================
 */
function isPendingActionValid(pendingAction) {
  if (!pendingAction) {
    return false;
  }

  // Check required fields
  if (
    !pendingAction.type ||
    !pendingAction.mealId ||
    !pendingAction.updateRequest
  ) {
    console.log("⚠️ Pending action missing required fields");
    return false;
  }

  // Check expiry (5 minute timeout)
  if (
    pendingAction.expiresAt &&
    Date.now() > pendingAction.expiresAt
  ) {
    console.log("⏰ Pending action expired");
    return false;
  }

  return true;
}

/*
 * ================================================================================
 * FILE UPLOAD CONFIGURATION (MULTER)
 * ================================================================================
 *
 * Multer handles file uploads from the mobile app (voice recordings).
 * When user records their voice, the mobile app sends the audio file here.
 *
 * WORKFLOW:
 * 1. User presses record button in app
 * 2. App records audio to .m4a file
 * 3. App sends file to /api/transcribe endpoint
 * 4. Multer saves file temporarily to uploads/ folder
 * 5. Whisper transcribes the audio to text
 * 6. Text is returned to app
 * 7. Temporary file is deleted
 *
 * ================================================================================
 */

// Configure how multer saves uploaded files
const storage = multer.diskStorage({
  // Where to save uploaded files
  destination: (req, file, cb) => {
    // Save to uploads/ folder
    cb(null, "uploads/");
  },
  // What to name the uploaded file
  filename: (req, file, cb) => {
    // Get the file extension from original filename (e.g., ".m4a")
    const ext = path.extname(file.originalname);

    // Generate unique filename to avoid conflicts
    // Format: timestamp-randomstring.m4a
    // Example: 1762356252904-7ibycb.m4a
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${ext}`;

    // Log the filename for debugging
    console.log("💾 Saving file as:", uniqueName);

    // Tell multer to use this filename
    cb(null, uniqueName);
  },
});

// Create the multer uploader with configuration
const upload = multer({
  // Use the storage configuration defined above
  storage: storage,

  // Set file size limit
  limits: {
    // 25MB maximum (this is Whisper API's limit)
    fileSize: 25 * 1024 * 1024,
  },

  // Filter function to validate uploaded files
  fileFilter: (req, file, cb) => {
    // Log what the mobile app is sending (for debugging)
    console.log("🔍 fileFilter called with:");
    console.log("   mimetype:", file.mimetype); // e.g., "audio/x-m4a"
    console.log("   originalname:", file.originalname); // e.g., "recording.m4a"
    console.log("   fieldname:", file.fieldname); // Should be "audio"

    // List of allowed MIME types (what the browser/app says the file is)
    const allowedTypes = [
      "audio/mp3",
      "audio/mpeg",
      "audio/wav",
      "audio/m4a",
      "audio/webm",
      "audio/mp4",
      "audio/x-m4a",
    ];

    // List of allowed file extensions
    const allowedExtensions = [
      ".mp3",
      ".mp4",
      ".mpeg",
      ".mpga",
      ".m4a",
      ".wav",
      ".webm",
    ];

    // Check if the MIME type is in our allowed list
    const hasValidMimeType =
      file.mimetype && allowedTypes.includes(file.mimetype);

    // Check if the file extension is in our allowed list
    const hasValidExtension =
      file.originalname &&
      allowedExtensions.some((ext) =>
        file.originalname.toLowerCase().endsWith(ext)
      );

    // Accept file if:
    // - MIME type is valid OR
    // - File extension is valid OR
    // - It's coming from the 'audio' form field (lenient for React Native)
    if (
      hasValidMimeType ||
      hasValidExtension ||
      file.fieldname === "audio"
    ) {
      console.log("   ✅ File accepted");
      // cb(null, true) means "accept this file"
      cb(null, true);
    } else {
      console.log("   ❌ File rejected");
      // cb(error) means "reject this file"
      cb(
        new Error(
          "Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm"
        )
      );
    }
  },
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/*
 * ================================================================================
 * MIDDLEWARE SETUP
 * ================================================================================
 */

// Enable CORS (Cross-Origin Resource Sharing)
// This allows the mobile app to make requests to this server from a different domain
app.use(cors());

// Enable JSON parsing for request bodies
// When the mobile app sends JSON data, Express will automatically parse it
app.use(express.json());

/*
 * ================================================================================
 * SYSTEM PROMPT - AI INSTRUCTIONS
 * ================================================================================
 *
 * This is the "instruction manual" for the AI (GPT-4).
 * It tells the AI:
 * - What its role is (Ava, a fitness coach)
 * - How to behave in conversations
 * - What tools it has available
 * - Step-by-step workflows to follow
 *
 * THINK OF THIS AS: A very detailed employee training manual that explains
 * exactly how to handle every type of customer request.
 *
 * WHY THIS MATTERS FOR DEBUGGING:
 * If the AI isn't following the correct workflow (like our current bug where
 * it doesn't analyze findRecentMeals results), the issue might be:
 * 1. The instructions here aren't clear enough
 * 2. The AI is ignoring these instructions
 * 3. The technical implementation isn't letting the AI follow these instructions
 *
 * ⚠️ CURRENT BUG CONTEXT:
 * Lines 266-286 contain the meal editing workflow instructions.
 * The AI is supposed to:
 * 1. Call findRecentMeals
 * 2. Describe what it found
 * 3. Ask for confirmation
 * 4. THEN call analyzeAndUpdateMeal
 *
 * But currently, step 2-3 aren't happening - the AI calls findRecentMeals
 * and then generates EMPTY TEXT instead of describing what it found.
 *
 * ================================================================================
 */

// The system prompt - these are the AI's instructions
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
   - IMPORTANT: Always include timestamp parameter using: new Date().toISOString()

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

**✅ NEW TWO-STEP WORKFLOW (AUTOMATED):**

**What happens when user wants to edit:**

1. **You call findRecentMeals** - This fetches recent meals from database
2. **System automatically analyzes** - A second AI call identifies which meal (happens automatically)
3. **You receive response** - System tells you which meal was identified with full details
4. **You confirm with user** - Ask if they want to make the change
5. **User confirms** - They say "yes" or similar
6. **You call analyzeAndUpdateMeal** - Update happens with natural language

**IMPORTANT: The workflow is now SIMPLER for you:**
- You DON'T need to manually analyze which meal - the system does it automatically
- After calling findRecentMeals, you'll get a clear description of the identified meal
- Just present that to the user and ask for confirmation
- Then call analyzeAndUpdateMeal with the meal ID

**Step 1 - FIND THE MEAL:**
- **Call findRecentMeals tool**: \`findRecentMeals({ limit: 10 })\`
- This returns the last 10 meals
- ⚠️ The system will AUTOMATICALLY identify which meal the user means
- You'll receive a response describing the identified meal

**Step 2 - CONFIRM THE CHANGE:**
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

**Step 3 - UPDATE (AI-DRIVEN):**
After user confirms, call analyzeAndUpdateMeal WITH the natural language update request.

⚠️ **AI-DRIVEN APPROACH:**
The analyzeAndUpdateMeal tool accepts natural language! You don't need to structure the update manually.
Just pass the user's intent in plain English and AI will handle the rest.

EXAMPLE:
User confirms → Call: \`analyzeAndUpdateMeal({ mealId: "<meal_id_from_identification>", updateRequest: "change to lunch" })\`

CRITICAL: The meal ID will be provided to you by the system after findRecentMeals completes.
DO NOT make up placeholder IDs - use the exact ID provided in the response.

### CONCRETE WORKFLOW EXAMPLES (AI-DRIVEN UPDATES):

**Example 1 - Changing meal type:**
User: "Actually that was lunch not breakfast"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 sunny side eggs (140 cal | 12g P, 1g C, 10g F, 0g Fb). I'll change this to be logged as lunch instead. The macros will stay the same. Should I make this update?"
User: "Yes"
You: *Call analyzeAndUpdateMeal({ mealId: "abc123", updateRequest: "change to lunch" })*
You: "✅ Updated! Your meal is now logged as lunch."

**Example 2 - Changing quantity:**
User: "Wait I only had 1 egg not 2"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 eggs (180 cal | 12g P, 2g C, 14g F, 0g Fb). I'll update this to 1 egg (90 cal | 6g P, 1g C, 7g F, 0g Fb). Should I make this change?"
User: "Yes please"
You: *Call analyzeAndUpdateMeal({ mealId: "abc123", updateRequest: "change to 1 egg instead of 2" })*
You: "✅ Updated! Your breakfast now shows 1 egg (90 cal | 6g P, 1g C, 7g F, 0g Fb)."

**Example 3 - Adding food to existing meal:**
User: "I also had toast with that"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 eggs (180 cal | 12g P, 2g C, 14g F, 0g Fb). I'll add 2 slices of toast (160 cal | 6g P, 30g C, 2g F, 2g Fb). Your breakfast total will become approximately 340 cal. Should I add this?"
User: "Yes"
You: *Call analyzeAndUpdateMeal({ mealId: "abc123", updateRequest: "add 2 slices of toast" })*
You: "✅ Updated! Your breakfast now includes 2 eggs and 2 slices of toast (340 cal | 18g P, 32g C, 16g F, 2g Fb)."

**Example 4 - Flexible updates (only half):**
User: "I only ate half of that"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your lunch with chicken sandwich (450 cal | 35g P, 40g C, 12g F, 3g Fb). I'll update this to half portion (225 cal | 17.5g P, 20g C, 6g F, 1.5g Fb). Should I make this change?"
User: "Yes"
You: *Call analyzeAndUpdateMeal({ mealId: "xyz123", updateRequest: "only ate half" })*
You: "✅ Updated! Your lunch now shows half portion."

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
  Example call:
  logMeal({
    mealType: "breakfast",
    timestamp: new Date().toISOString(),
    foods: [{ name: "scrambled eggs", quantity: "2 eggs", calories: 180, protein: 12, carbs: 1, fats: 14, fiber: 0 }]
  })
- findRecentMeals: Find meals for editing context
- analyzeAndUpdateMeal: Update existing meal using AI (use after confirmation)
- getDailySummary: Get today's calorie totals

### IMPORTANT: SYSTEM HANDLES findRecentMeals ANALYSIS

✅ **UPDATED BEHAVIOR:**
When you call findRecentMeals, the system automatically performs a second AI analysis to identify which meal the user is referring to. You will receive a complete response that describes the meal. Simply present that response to the user and ask for confirmation.

After using tools:
- After logMeal: Confirm what was logged with calorie breakdown
- After analyzeAndUpdateMeal: Confirm what was updated and show new values
- After findRecentMeals: System provides meal description automatically - present it to user

Trust your intelligence to detect intent naturally. Don't overthink - you're smart enough to understand when someone ate vs. will eat.`;

/*
 * ================================================================================
 * API ENDPOINTS
 * ================================================================================
 */

/*
 * HEALTH CHECK ENDPOINT
 *
 * Purpose: Simple endpoint to verify the server is running
 * Used by: Railway hosting platform, development testing
 * Returns: Status message and current timestamp
 */
app.get("/", (req, res) => {
  res.json({
    status: "Ninety API is running!",
    timestamp: new Date().toISOString(),
  });
});

/*
 * ============================================================================
 * VOICE TRANSCRIPTION ENDPOINT: /api/transcribe
 * ============================================================================
 *
 * PURPOSE:
 * Converts voice recordings from the mobile app into text using OpenAI Whisper.
 *
 * WORKFLOW:
 * 1. Mobile app records user's voice (e.g., "I had 2 eggs for breakfast")
 * 2. App sends audio file as multipart/form-data with field name "audio"
 * 3. Multer middleware (upload.single('audio')) saves file temporarily
 * 4. We create a read stream of the file
 * 5. Send to OpenAI Whisper API for transcription
 * 6. Return transcribed text to mobile app
 * 7. Delete temporary file (cleanup)
 *
 * TECHNICAL DETAILS:
 * - Accepts audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
 * - Max file size: 25MB (Whisper's limit)
 * - Uses gpt-4o-mini-transcribe model (optimized for speed and cost)
 * - Temporary files stored in ./uploads/ directory
 *
 * ============================================================================
 */
app.post(
  "/api/transcribe",
  upload.single("audio"),
  async (req, res) => {
    // Log that this endpoint was called
    console.log("🎙️ Railway API: POST /api/transcribe called");

    // Track the temporary file path so we can delete it later
    let tempFilePath = null;

    /*
     * TRY-CATCH-FINALLY BLOCK
     *
     * try: Attempt the transcription process
     * catch: Handle any errors that occur
     * finally: ALWAYS delete the temporary file (even if there was an error)
     *
     * This ensures we don't fill up the server's disk with abandoned audio files.
     */
    try {
      // Log the file details for debugging
      // req.file is populated by multer middleware (upload.single('audio'))
      console.log(
        "📦 req.file received:",
        JSON.stringify(req.file, null, 2)
      );

      // Check if multer actually received a file
      if (!req.file) {
        console.error("❌ No file received in request");
        // Return 400 Bad Request with error message
        return res
          .status(400)
          .json({ error: "No audio file provided" });
      }

      // Store the path where multer saved the file
      tempFilePath = req.file.path;

      // Log file details for monitoring
      console.log("📁 Uploaded file:", req.file.originalname);
      console.log(
        "📊 File size:",
        (req.file.size / 1024 / 1024).toFixed(2),
        "MB"
      );
      console.log(
        "🔑 OpenAI API Key present:",
        !!process.env.OPENAI_API_KEY
      );

      // Create a read stream from the saved file
      // Whisper API requires a stream, not just a file path
      const audioFile = fs.createReadStream(tempFilePath);

      // Call OpenAI Whisper API to transcribe the audio
      console.log("🎵 Starting transcription with Whisper...");
      const transcription =
        await openaiClient.audio.transcriptions.create({
          // The audio file stream
          file: audioFile,

          // The transcription model to use
          // gpt-4o-mini-transcribe is faster and cheaper than whisper-1
          model: "gpt-4o-mini-transcribe",

          // Return plain text (not JSON with timestamps)
          response_format: "text",

          // Optional prompt to give context to Whisper
          // Helps with domain-specific vocabulary (fitness terms, food names, etc.)
          prompt:
            "The following is a conversation about fitness, workouts, nutrition, and health-related topics.",
        });

      // Log success
      console.log("✅ Transcription successful");
      console.log(
        "📝 Transcribed text:",
        transcription.substring(0, 100) + "..."
      );

      // Return the transcribed text to the mobile app
      res.json({
        transcription: transcription,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
      });
    } catch (error) {
      // If anything goes wrong (file error, Whisper API error, etc.)
      console.error("❌ Transcription error:", error);

      // Return 500 Internal Server Error with details
      res.status(500).json({
        error: "Transcription failed",
        details: error.message,
      });
    } finally {
      /*
       * CLEANUP: Delete the temporary file
       *
       * This runs no matter what (success or error).
       * We must delete the file because:
       * 1. Railway has limited disk space
       * 2. We don't need the audio after transcription
       * 3. Files would accumulate and eventually fill the disk
       */
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          // Delete the file
          fs.unlinkSync(tempFilePath);
          console.log("🗑️ Cleaned up temporary file:", tempFilePath);
        } catch (cleanupError) {
          console.error(
            "⚠️ Failed to cleanup file:",
            cleanupError.message
          );
        }
      }
    }
  }
);

/*
 * ============================================================================
 * PRODUCTION ERROR HANDLING
 * ============================================================================
 *
 * If Firestore is unavailable, we fail loudly with clear error messages.
 * This is much safer than silently using mock data.
 *
 * ============================================================================
 */

/*
 * ============================================================================
 * AI TOOLS DEFINITION
 * ============================================================================
 *
 * These are the "functions" that the AI can call during a conversation.
 * Think of them like buttons the AI can press to take actions.
 *
 * HOW IT WORKS:
 * 1. User says: "I had 2 eggs for breakfast"
 * 2. AI reads the system prompt and conversation history
 * 3. AI decides: "I should call the logMeal tool"
 * 4. AI calls: logMeal({ mealType: "breakfast", foods: [...], ... })
 * 5. Tool executes (saves to database)
 * 6. Tool returns result: { success: true, mealId: "abc123" }
 * 7. AI reads the result
 * 8. AI responds to user: "✅ Logged your breakfast!"
 *
 * VERCEL AI SDK V5 SYNTAX:
 * - Uses Zod for schema validation
 * - Each tool has: description, inputSchema, execute function
 *
 * ============================================================================
 */
const tools = {
  /*
   * ============================================================================
   * TOOL: logMeal
   * ============================================================================
   *
   * PURPOSE:
   * Save a new meal to the user's food diary in Firestore.
   *
   * WHEN AI USES THIS:
   * - User says: "I had 2 eggs for breakfast"
   * - User confirms: "Yes, log it"
   * - After AI has shown user the macro breakdown and gotten confirmation
   *
   * IMPORTANT: AI should ALWAYS confirm with user before calling this tool!
   * Show the breakdown, ask "Should I log this?", THEN call logMeal.
   *
   * ============================================================================
   */
  logMeal: tool({
    // Description tells the AI when to use this tool
    description:
      "Log a new meal to the user's food diary. Use when user mentions eating food.",

    // Define the parameters this tool accepts (validated with Zod)
    inputSchema: z.object({
      // Meal type: must be one of these four options
      mealType: z
        .enum(["breakfast", "lunch", "dinner", "snack"])
        .describe("Type of meal"),

      // Array of food items in this meal
      foods: z
        .array(
          z.object({
            name: z.string().describe("Food name"),
            quantity: z
              .string()
              .describe(
                'Quantity with unit (e.g., "2 eggs", "1 cup")'
              ),
            calories: z.number().describe("Calories"),
            protein: z.number().describe("Protein in grams"),
            carbs: z.number().describe("Carbs in grams"),
            fats: z.number().describe("Fats in grams"),
            fiber: z.number().describe("Fiber in grams"),
          })
        )
        .describe("List of foods in the meal"),

      // When the meal was eaten (ISO 8601 format)
      timestamp: z
        .string()
        .optional()
        .describe(
          "ISO timestamp of when meal was eaten (use new Date().toISOString())"
        ),

      // Optional notes (e.g., "eaten at restaurant", "homemade")
      notes: z
        .string()
        .optional()
        .describe("Optional notes about the meal"),
    }),

    // This function executes when AI calls the tool
    execute: async (
      { mealType, foods, timestamp, notes },
      { abortSignal }
    ) => {
      // Log that this tool is executing
      console.log("🔧 Executing logMeal tool");

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot log meal"
        );
        return {
          success: false,
          message: "Database unavailable. Please try again later.",
        };
      }

      // If we reach here, Firestore IS available
      try {
        /*
         * CALCULATE TOTAL MACROS
         *
         * Loop through all foods and sum up their macros.
         * Example: [eggs: 180cal, toast: 160cal] → total: 340cal
         */
        const totals = foods.reduce(
          (acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fats: acc.fats + (food.fats || 0),
            fiber: acc.fiber + (food.fiber || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
        );

        /*
         * CREATE THE MEAL DOCUMENT
         *
         * This is what gets saved to Firestore.
         * Structure matches what the mobile app expects.
         */
        // Convert ISO string to Firestore Timestamp with fallback to current time
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        if (isNaN(dateObj.getTime())) {
          console.warn(
            `⚠️ Invalid timestamp "${timestamp}", using current time`
          );
          dateObj = new Date();
        }

        const mealData = {
          // Meal type (breakfast/lunch/dinner/snack)
          mealType,

          // Timestamp of when meal was eaten
          timestamp: admin.firestore.Timestamp.fromDate(dateObj),

          // Array of individual food items with their macros
          foods,

          // Total macros for the entire meal
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          totalFiber: totals.fiber,

          // Photo fields (for future photo upload feature)
          photoUrl: null,
          photoUrls: [],

          // User's notes about the meal
          notes: notes || "",

          // How this meal was logged (chat vs. manual entry in app)
          loggedVia: "chat",

          // Firestore server timestamp (auto-set when document is created)
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Get reference to this user's meals collection
        // Path: nutrition/{userId}/meals/{auto-generated-id}
        const mealsRef = db
          .collection("nutrition")
          .doc(userId)
          .collection("meals");

        // Add the meal document to Firestore
        // Firestore will auto-generate a unique ID
        const docRef = await mealsRef.add(mealData);

        // Log success with the generated document ID
        console.log("✅ Meal logged to Firestore:", docRef.id);

        // Return success to the AI
        return {
          success: true,
          mealId: docRef.id,
          message: "Meal logged successfully",
        };
      } catch (error) {
        // If something goes wrong (network error, permission error, etc.)
        console.error("❌ Error logging meal to Firestore:", error);

        // Return error to the AI
        return { success: false, message: `Error: ${error.message}` };
      }
    },
  }),

  /*
   * ============================================================================
   * TOOL: findRecentMeals
   * ============================================================================
   *
   * PURPOSE:
   * Searches the database for the user's recent meals. This is CRITICAL for
   * the meal update workflow because the AI needs to see what meals exist
   * before it can identify which one to update.
   *
   * WHEN AI USES THIS:
   * - User says: "Actually that was lunch not breakfast"
   * - User says: "I also had toast with that"
   * - User says: "Change my breakfast to lunch"
   *
   * HOW IT WORKS:
   * 1. AI calls this tool (possibly with containsFood parameter)
   * 2. Tool queries Firestore for user's recent meals
   * 3. Tool returns array of meals with their IDs
   * 4. AI should READ these results and identify which meal user means
   * 5. AI should describe the meal to user and ask for confirmation
   * 6. AI should then call analyzeAndUpdateMeal with the real meal ID
   *
   * ⚠️ CURRENT BUG:
   * Step 4 above is NOT happening - AI generates empty text after calling
   * this tool, so the fallback logic kicks in and says "couldn't find meals"
   * even when meals WERE found.
   *
   * ============================================================================
   */
  findRecentMeals: tool({
    // Tell AI what this tool does and when to use it
    description:
      "Find recent meals for context. REQUIRED before calling analyzeAndUpdateMeal. Use when user references a previous meal or wants to edit. Returns actual meal IDs needed for updates.",

    // Define what parameters this tool accepts
    inputSchema: z.object({
      // How many meals to return (default is 10)
      limit: z
        .number()
        .optional()
        .describe("Maximum number of meals to return (default: 10)"),
    }),

    // This function executes when AI calls the tool
    execute: async ({ limit }, { abortSignal }) => {
      // Log that this tool is being executed
      console.log("🔧 Executing findRecentMeals tool");

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot find meals"
        );
        return {
          meals: [],
          error: "Database unavailable. Please try again later.",
        };
      }

      // If we reach here, Firestore IS available
      try {
        // Get a reference to this user's meals collection in Firestore
        // Path: nutrition/{userId}/meals
        const mealsRef = db
          .collection("nutrition")
          .doc(userId)
          .collection("meals");

        // Build the query:
        // - orderBy('createdAt', 'desc'): Sort by creation time, newest first
        // - limit(10): Only get the most recent 10 meals (or specified limit)
        let query = mealsRef
          .orderBy("createdAt", "desc")
          .limit(limit || 10);

        // Execute the query and get results
        const snapshot = await query.get();

        // Create array to store the meals we'll return
        let meals = [];

        // Loop through each document (meal) that Firestore returned
        snapshot.forEach((doc) => {
          // Get all the data from this meal document
          const data = doc.data();

          // Add this meal to our results array
          // AI will analyze which meal user is referring to based on conversation context
          meals.push({
            // ✅ CRITICAL: Include the Firestore document ID
            // This is what analyzeAndUpdateMeal needs to know which meal to update
            id: doc.id,

            // Meal type (breakfast/lunch/dinner/snack)
            mealType: data.mealType,

            // When the meal was eaten (ISO string format)
            // Try timestamp first, fall back to createdAt if timestamp is missing
            timestamp:
              data.timestamp?.toDate().toISOString() ||
              data.createdAt?.toDate().toISOString(),

            // Array of food items in this meal
            foods: data.foods || [],

            // Total nutrition values for the entire meal
            totalCalories: data.totalCalories || 0,
            totalProtein: data.totalProtein || 0,
            totalCarbs: data.totalCarbs || 0,
            totalFats: data.totalFats || 0,
            totalFiber: data.totalFiber || 0,

            // Optional notes about the meal
            notes: data.notes || "",
          });
        });

        // Log how many meals we found
        console.log(
          `✅ Found ${meals.length} recent meals from Firestore`
        );

        // Return the meals array wrapped in an object
        // This matches the structure expected by the AI
        return { meals };
      } catch (error) {
        // If something goes wrong (Firestore error, etc.)
        console.error("❌ Error finding meals in Firestore:", error);

        // Return empty array so the AI knows no meals were found
        return { meals: [] };
      }
    },
  }),

  /*
   * ============================================================================
   * TOOL: analyzeAndUpdateMeal
   * ============================================================================
   *
   * PURPOSE:
   * AI-driven meal update that handles ANY type of modification flexibly.
   *
   * WHEN AI USES THIS:
   * - User says: "Actually that was lunch, not breakfast"
   * - User says: "I also had a Coke with that"
   * - User says: "I only ate half of that"
   * - User says: "There was no cheese actually"
   * - User says: "Add a note: it had hot sauce"
   *
   * HOW IT WORKS (AI-DRIVEN APPROACH):
   * 1. Accepts: meal ID + natural language update request
   * 2. Fetches the existing meal from Firestore
   * 3. Makes AI call to analyze: existing meal + update request → new meal
   * 4. AI generates complete new meal object with all macros recalculated
   * 5. Saves the updated meal to Firestore
   * 6. Returns success with summary of changes
   *
   * WHY AI-DRIVEN?
   * The old approach required structured parameters (foods array, notes, mealType).
   * This was too rigid - couldn't handle "I also had a Coke" or "only half".
   * With AI analysis, we can handle ANY natural language update flexibly.
   *
   * IMPORTANT:
   * The meal ID MUST come from findRecentMeals - NEVER use placeholder IDs.
   *
   * ============================================================================
   */
  analyzeAndUpdateMeal: tool({
    // Description tells the AI when and how to use this tool
    description:
      "Update an existing meal using AI analysis. Use this for ANY meal modification. Accepts natural language update requests. CRITICAL: You MUST call findRecentMeals first to get the meal ID. NEVER use placeholder IDs.",

    // Define parameters
    inputSchema: z.object({
      // The Firestore document ID (MUST come from findRecentMeals)
      mealId: z
        .string()
        .describe(
          'The meal ID from findRecentMeals (NEVER use placeholders like "xyz789" or "abc123")'
        ),

      // Natural language description of what needs to change
      updateRequest: z
        .string()
        .describe(
          'What the user wants to change, in natural language (e.g., "change to lunch", "add a Coke", "only half", "no cheese", "add note: had hot sauce")'
        ),
    }),

    // This function executes when AI calls the tool
    execute: async ({ mealId, updateRequest }, { abortSignal }) => {
      console.log("🔧 Executing analyzeAndUpdateMeal tool");
      console.log("   Meal ID:", mealId);
      console.log("   Update request:", updateRequest);

      /*
       * VALIDATION: Reject placeholder IDs
       */
      const placeholders = [
        "xyz789",
        "abc123",
        "12345",
        "mealId_placeholder",
        "meal_placeholder",
      ];
      if (placeholders.includes(mealId)) {
        console.error(
          "❌ REJECTED: AI used placeholder ID instead of calling findRecentMeals"
        );
        return {
          success: false,
          message:
            'ERROR: You must call findRecentMeals first to get the real meal ID. Never use placeholder IDs like "xyz789".',
        };
      }

      /*
       * VALIDATION: Check if ID looks real
       */
      if (mealId.length < 10) {
        console.error(
          "❌ REJECTED: Meal ID too short, likely a placeholder:",
          mealId
        );
        return {
          success: false,
          message:
            "ERROR: Invalid meal ID. You must call findRecentMeals first to get the real meal ID.",
        };
      }

      // Get the current user's ID
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot update meal"
        );
        return {
          success: false,
          message: "Database unavailable. Please try again later.",
        };
      }

      try {
        /*
         * STEP 1: Fetch the existing meal from Firestore
         */
        const mealRef = db
          .collection("nutrition")
          .doc(userId)
          .collection("meals")
          .doc(mealId);

        const mealDoc = await mealRef.get();

        if (!mealDoc.exists) {
          console.error("❌ Meal not found:", mealId);
          return {
            success: false,
            message:
              "Meal not found. It may have been deleted or the ID is incorrect.",
          };
        }

        const existingMeal = mealDoc.data();
        console.log("📦 Existing meal fetched:", {
          mealType: existingMeal.mealType,
          foods: existingMeal.foods?.map((f) => f.name).join(", "),
          totalCalories: existingMeal.totalCalories,
        });

        /*
         * STEP 2: Use AI to analyze the update and generate new meal object
         *
         * We're making a nested AI call here. The outer AI (main chat) called
         * this tool. Now we're calling another AI to analyze the meal update.
         *
         * This AI call will:
         * - Understand the existing meal structure
         * - Parse the update request (natural language)
         * - Generate a complete new meal object with recalculated macros
         */
        const analysisPrompt = `You are a nutrition analysis assistant. Your job is to update meal data based on user requests.

EXISTING MEAL:
${JSON.stringify(existingMeal, null, 2)}

USER UPDATE REQUEST:
"${updateRequest}"

INSTRUCTIONS:
1. Analyze what the user wants to change
2. Generate a COMPLETE new meal object with ALL fields
3. If foods changed: recalculate all totals (calories, protein, carbs, fats, fiber)
4. If user says "half" or "only half": divide quantities and macros by 2
5. If user says "add [food]": add that food to the foods array AND add its macros to totals
6. If user says "no [food]": remove that food AND subtract its macros from totals
7. If user changes meal type: update mealType field
8. If user adds a note: update notes field

CRITICAL RULES:
- ALWAYS include all existing foods unless explicitly removed
- ALWAYS recalculate totals when foods change
- Use your nutrition knowledge to estimate macros for new foods
- Preserve the meal structure exactly (same field names)

Return ONLY a valid JSON object with this structure:
{
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "foods": [
    {
      "name": "food name",
      "quantity": "amount (e.g., '2 eggs', '1 cup', '100g')",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fats": number,
      "fiber": number
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFats": number,
  "totalFiber": number,
  "notes": "any notes",
  "changesSummary": "brief summary of what changed (for user confirmation)"
}`;

        console.log("🤖 Calling AI to analyze meal update...");

        const analysisResult = await generateText({
          model: anthropic("claude-sonnet-4-5"),
          messages: [
            {
              role: "user",
              content: analysisPrompt,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent structured output
        });

        console.log("✅ AI analysis complete");
        console.log("📄 Raw AI response:", analysisResult.text);

        /*
         * STEP 3: Parse the AI's response to get the new meal object
         */
        let newMeal;
        try {
          // Extract JSON from the response (AI might wrap it in markdown code blocks)
          let jsonText = analysisResult.text.trim();

          // Remove markdown code blocks if present
          if (jsonText.startsWith("```json")) {
            jsonText = jsonText
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "");
          } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
          }

          newMeal = JSON.parse(jsonText);
          console.log("✅ Parsed new meal object:", {
            mealType: newMeal.mealType,
            foods: newMeal.foods?.map((f) => f.name).join(", "),
            totalCalories: newMeal.totalCalories,
            changesSummary: newMeal.changesSummary,
          });
        } catch (parseError) {
          console.error(
            "❌ Failed to parse AI response as JSON:",
            parseError
          );
          console.error("Raw response was:", analysisResult.text);
          return {
            success: false,
            message:
              "Failed to analyze the update. Please try rephrasing your request.",
          };
        }

        /*
         * STEP 4: Validate the new meal object has required fields
         */
        if (
          !newMeal.mealType ||
          !newMeal.foods ||
          !Array.isArray(newMeal.foods)
        ) {
          console.error("❌ Invalid meal object from AI:", newMeal);
          return {
            success: false,
            message:
              "Failed to generate valid meal update. Please try again.",
          };
        }

        /*
         * STEP 5: Save the updated meal to Firestore
         */
        const updates = {
          mealType: newMeal.mealType,
          foods: newMeal.foods,
          totalCalories: newMeal.totalCalories || 0,
          totalProtein: newMeal.totalProtein || 0,
          totalCarbs: newMeal.totalCarbs || 0,
          totalFats: newMeal.totalFats || 0,
          totalFiber: newMeal.totalFiber || 0,
          notes: newMeal.notes || "",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await mealRef.update(updates);

        console.log("✅ Meal updated in Firestore:", mealId);

        /*
         * STEP 6: Return success with summary
         */
        return {
          success: true,
          message: "Meal updated successfully",
          changesSummary:
            newMeal.changesSummary || "Your meal has been updated.",
          updatedMeal: {
            mealType: newMeal.mealType,
            totalCalories: newMeal.totalCalories,
            totalProtein: newMeal.totalProtein,
            totalCarbs: newMeal.totalCarbs,
            totalFats: newMeal.totalFats,
            foods: newMeal.foods.map((f) => f.name).join(", "),
          },
        };
      } catch (error) {
        console.error("❌ Error in analyzeAndUpdateMeal:", error);
        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }
    },
  }),

  /*
   * ============================================================================
   * TOOL: getDailySummary
   * ============================================================================
   *
   * PURPOSE:
   * Get a summary of all meals and total macros for a specific day.
   *
   * WHEN AI USES THIS:
   * - User asks: "How many calories have I had today?"
   * - User asks: "What did I eat today?"
   * - User asks: "Am I on track for my calorie goal?"
   *
   * WHAT IT RETURNS:
   * - Total calories for the day
   * - Total macros (protein, carbs, fats, fiber)
   * - Calorie target (currently hardcoded to 2400, should be user-specific)
   * - Progress percentage (actual calories / target)
   * - Number of meals logged
   *
   * ============================================================================
   */
  getDailySummary: tool({
    // Description tells the AI when to use this tool
    description:
      "Get daily calorie summary and meals for a specific date.",

    // Define parameters
    inputSchema: z.object({
      // Date in YYYY-MM-DD format (e.g., "2025-11-05")
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),

    // This function executes when AI calls the tool
    execute: async ({ date }, { abortSignal }) => {
      // Log that this tool is executing
      console.log("🔧 Executing getDailySummary tool");

      // Get the current user's ID
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot get daily summary"
        );
        return {
          totalCalories: 0,
          calorieTarget: 2400,
          progress: 0,
          mealsCount: 0,
          error: "Database unavailable. Please try again later.",
        };
      }

      // If we reach here, Firestore IS available
      try {
        /*
         * CREATE START AND END OF DAY TIMESTAMPS
         *
         * To get all meals for a specific day, we need to query for meals
         * where timestamp is between 00:00:00 and 23:59:59 of that day.
         */

        // Parse the date string (e.g., "2025-11-05")
        const targetDate = new Date(date);

        // Create timestamp for start of day (00:00:00)
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        // Create timestamp for end of day (23:59:59)
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get reference to this user's meals collection
        const mealsRef = db
          .collection("nutrition")
          .doc(userId)
          .collection("meals");

        // Query for all meals within this day
        // WHERE timestamp >= start of day AND timestamp <= end of day
        const snapshot = await mealsRef
          .where(
            "timestamp",
            ">=",
            admin.firestore.Timestamp.fromDate(startOfDay)
          )
          .where(
            "timestamp",
            "<=",
            admin.firestore.Timestamp.fromDate(endOfDay)
          )
          .get();

        // Initialize totals for all macros
        const totals = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          fiber: 0,
        };
        let mealsCount = 0;

        // Loop through each meal document and sum up the totals
        snapshot.forEach((doc) => {
          // Get the meal data
          const data = doc.data();

          // Add this meal's macros to the running totals
          totals.calories += data.totalCalories || 0;
          totals.protein += data.totalProtein || 0;
          totals.carbs += data.totalCarbs || 0;
          totals.fats += data.totalFats || 0;
          totals.fiber += data.totalFiber || 0;

          // Increment meal counter
          mealsCount++;
        });

        // Log success
        console.log(
          "✅ Daily summary from Firestore:",
          totals.calories,
          "calories"
        );

        // Return the summary to the AI
        return {
          // The date we queried for
          date,

          // Total macros for the day
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFats: totals.fats,
          totalFiber: totals.fiber,

          // Calorie target (TODO: should be user-specific from profile)
          calorieTarget: 2400,

          // Progress as a percentage (capped at 100%)
          progress: Math.min(totals.calories / 2400, 1.0),

          // Number of meals logged today
          mealsCount,
        };
      } catch (error) {
        // If something goes wrong (Firestore error, invalid date, etc.)
        console.error(
          "❌ Error getting daily summary from Firestore:",
          error
        );

        // Return zeros so the AI can inform the user
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

/*
 * ============================================================================
 * MAIN CHAT API ENDPOINT: /api/chat
 * ============================================================================
 *
 * THIS IS THE HEART OF THE APPLICATION - WHERE THE BUG IS OCCURRING!
 *
 * PURPOSE:
 * Handle chat messages from the mobile app, use AI to understand the message,
 * call appropriate tools (logMeal, findRecentMeals, etc.), and respond.
 *
 * WORKFLOW:
 * 1. Mobile app sends message + conversation history
 * 2. We call OpenAI with the system prompt, conversation, and available tools
 * 3. AI analyzes the message and decides if it needs to call any tools
 * 4. If tools are called, they execute and return results to the AI
 * 5. AI reads tool results and generates a natural language response
 * 6. We send the AI's response back to the mobile app
 *
 * ⚠️ CURRENT BUG LOCATION:
 * In step 5, the AI is generating EMPTY TEXT after calling findRecentMeals.
 * The fallback logic (lines 1390-1436) tries to compensate but doesn't have
 * enough context to properly identify which meal the user is referring to.
 *
 * THE ROOT CAUSE:
 * After calling findRecentMeals, result.text is empty. This means the AI
 * called the tool but didn't generate any text response describing what it found.
 *
 * ============================================================================
 */
app.post("/api/chat", async (req, res) => {
  // Log that this endpoint was called
  console.log("🚀 Railway API: POST /api/chat called");
  console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

  /*
   * TRY-CATCH BLOCK
   *
   * try: Process the chat message with AI
   * catch: Handle any errors (AI API failures, tool execution errors, etc.)
   */
  try {
    // Extract data from the mobile app's request
    // messages: Array of conversation history [{role: "user", content: "..."}, ...]
    // userId: The user's Firebase Auth UID
    // recentMealsContext: Optional array of recent meals sent by the app
    // pendingAction: Optional action from previous turn (meal update waiting for confirmation)
    let { messages, userId, recentMealsContext, pendingAction } =
      req.body;

    // Log what we received
    console.log(
      "🤖 Setting up AI with",
      messages?.length || 0,
      "messages"
    );
    console.log("👤 User ID:", userId);
    console.log(
      "🔑 OpenAI API Key present:",
      !!process.env.OPENAI_API_KEY
    );

    // Validation: Ensure messages array was provided
    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "Messages array is required" });
    }

    /*
     * ============================================================================
     * PENDING ACTION HANDLING
     * ============================================================================
     *
     * If there's a pendingAction from a previous turn (e.g., meal identified
     * but not yet confirmed), check if the user is confirming or rejecting it.
     *
     * WORKFLOW:
     * Turn 1: User says "I also had coca-cola" → meal identified → pendingAction created
     * Turn 2: User says "Yes" → Execute pendingAction directly (skip AI analysis)
     *         User says "No" → Clear pendingAction, let AI handle naturally
     *         User says something else → Keep pendingAction, let AI handle
     *
     * ============================================================================
     */
    if (pendingAction && isPendingActionValid(pendingAction)) {
      console.log("🔄 Pending action detected:", pendingAction.type);

      // Get the user's latest message
      const latestMessage =
        messages[messages.length - 1]?.content?.toLowerCase() || "";

      // Check if user is CONFIRMING the pending action
      if (
        latestMessage.match(
          /^(yes|yeah|yep|yup|sure|ok|okay|correct|exactly|right|affirmative)/i
        )
      ) {
        console.log(
          "✅ User confirmed pending action - executing directly"
        );

        // Execute the pending action based on type
        if (pendingAction.type === "updateMeal") {
          try {
            // Call analyzeAndUpdateMeal directly with the stored mealId
            global.currentUserId = userId; // Set user context for the tool

            const updateResult =
              await tools.analyzeAndUpdateMeal.execute(
                {
                  mealId: pendingAction.mealId,
                  updateRequest: pendingAction.updateRequest,
                },
                {}
              );

            // Return the result immediately - no AI analysis needed!
            return res.json({
              message:
                updateResult.changesSummary ||
                "✅ Your meal has been updated!",
              pendingAction: null, // Clear the pending action
              usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
              },
            });
          } catch (error) {
            console.error(
              "❌ Error executing pending action:",
              error
            );
            // Fall through to normal AI flow if execution fails
            pendingAction = null;
          }
        }
      }

      // Check if user is REJECTING the pending action
      if (
        latestMessage.match(
          /^(no|nope|nah|cancel|wrong|not|negative|incorrect)/i
        )
      ) {
        console.log("❌ User rejected pending action - clearing it");
        pendingAction = null; // Clear it but continue to normal AI flow
        // Don't return early - let AI handle the rejection naturally
      }

      // For any other message, keep pendingAction and continue to normal AI flow
      // (it will be re-sent if still valid, or expire after 5 minutes)
    }

    /*
     * ADD RECENT MEALS CONTEXT TO SYSTEM PROMPT
     *
     * If the mobile app sent recent meals context, append it to the system prompt.
     * This gives the AI additional information about what meals the user has logged.
     *
     * NOTE: This is redundant since the AI can call findRecentMeals itself.
     * But it provides immediate context without requiring a tool call.
     */
    let systemPromptWithContext = SYSTEM_PROMPT;
    if (recentMealsContext && recentMealsContext.length > 0) {
      systemPromptWithContext +=
        "\n\nRECENT MEALS (for context when editing):\n";
      recentMealsContext.forEach((meal, idx) => {
        const foodNames = meal.foods.map((f) => f.name).join(", ");
        const timeStr = new Date(meal.timestamp).toLocaleTimeString(
          "en-US",
          { hour: "numeric", minute: "2-digit" }
        );
        systemPromptWithContext += `${
          idx + 1
        }. ${meal.mealType.toUpperCase()} at ${timeStr} - ${foodNames} (${
          meal.totalCalories
        } cal) [meal_id: ${meal.id}]\n`;
      });
    }

    /*
     * SET GLOBAL USER ID
     *
     * This is how the tools know which user's data to read/write.
     * When a tool (like logMeal) executes, it reads global.currentUserId.
     *
     * NOTE: This is not ideal for a production app because:
     * 1. Global variables can cause issues with concurrent requests
     * 2. Better to pass userId through tool parameters
     * But for now, this is how Vercel AI SDK v5 tools access context.
     */
    global.currentUserId = userId;

    /*
     * ============================================================================
     * CALL THE AI (VERCEL AI SDK V5 generateText)
     * ============================================================================
     *
     * This is where the magic happens! We're calling OpenAI GPT-4 with:
     * - The system prompt (instructions for the AI)
     * - The conversation history
     * - The available tools (logMeal, findRecentMeals, analyzeAndUpdateMeal, getDailySummary)
     *
     * HOW MULTI-STEP EXECUTION WORKS:
     * 1. AI reads the message and decides if it needs to call a tool
     * 2. If yes, AI calls the tool (e.g., findRecentMeals)
     * 3. Tool executes and returns results
     * 4. AI reads the tool results
     * 5. AI decides what to do next:
     *    - Call another tool? (e.g., analyzeAndUpdateMeal)
     *    - Generate a text response to the user?
     * 6. This loops up to maxSteps times (10 in our case)
     *
     * WHAT WE EXPECT TO GET BACK:
     * - result.text: The AI's final text response to the user
     * - result.steps: Array of steps (tool calls and results)
     * - result.usage: Token usage statistics
     *
     * ⚠️ THE BUG:
     * When AI calls findRecentMeals, result.text comes back EMPTY.
     * This suggests the AI is calling the tool but not generating text afterwards.
     *
     * ============================================================================
     */
    const result = await generateText({
      // Which AI model to use (Claude Sonnet 4.5 for better tool calling)
      model: anthropic("claude-sonnet-4-5"),

      // The system prompt (AI's instructions)
      system: systemPromptWithContext,

      // The conversation history
      // Format: [{role: "user", content: "..."}, {role: "assistant", content: "..."}, ...]
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),

      // The tools the AI can call
      tools,

      // Maximum number of steps (tool calls + responses) per request
      // Each new message from the user resets this counter
      maxSteps: 10,

      // Let AI decide when to use tools (vs. 'required' or 'none')
      toolChoice: "auto",

      // In v5, tools execute automatically using their built-in execute functions
      // We don't need to manually handle tool execution like in v4
    });

    // Log that the AI request succeeded (but this doesn't mean we got useful text!)
    console.log("✅ AI request successful");

    /*
     * ============================================================================
     * SIMPLE LOGGING FOR MONITORING
     * ============================================================================
     *
     * Basic logging to monitor AI responses without crashing on undefined properties.
     *
     * ============================================================================
     */
    console.log("📊 result.text:", result.text ? "present" : "EMPTY");
    console.log("📊 result.steps count:", result.steps?.length || 0);

    /*
     * ============================================================================
     * EXTRACT THE AI's RESPONSE TEXT
     * ============================================================================
     *
     * The AI SDK returns results in a complex structure. We need to extract
     * the actual text response that we'll send to the user.
     *
     * STRATEGY:
     * 1. Try result.text first (the final text from the AI)
     * 2. If that's empty, look through all assistant messages
     * 3. If that's still empty, use context-aware fallback logic
     *
     * ⚠️ THIS IS WHERE THE BUG MANIFESTS:
     * result.text is empty after findRecentMeals is called.
     *
     * ============================================================================
     */

    // Try to get the text from the simplest location first
    let message = result.text || "";

    /*
     * FALLBACK 1: Extract from all assistant messages
     *
     * Sometimes the AI generates multiple messages with tool calls mixed in.
     * We need to extract just the text parts.
     *
     * Example structure:
     * result.response.messages = [
     *   {role: "assistant", content: [{type: "tool-call", ...}]},
     *   {role: "tool", content: [{type: "tool-result", result: {...}}]},
     *   {role: "assistant", content: [{type: "text", text: "I found..."}]}
     * ]
     */
    if (!message || !message.trim()) {
      message = result.response.messages
        .filter((msg) => msg.role === "assistant")
        .map((msg) => {
          // Handle string content (simple case)
          if (typeof msg.content === "string") {
            return msg.content;
          }
          // Handle array content (mixed text and tool calls)
          if (Array.isArray(msg.content)) {
            return msg.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(" ");
          }
          return "";
        })
        .filter((text) => text.trim())
        .join("\n");
    }

    /*
     * ============================================================================
     * FALLBACK 2: Context-Aware Fallback Based on Tool Calls
     * ============================================================================
     *
     * If we reach here, both result.text and the assistant messages were empty.
     * This means the AI called tools but didn't generate any text response.
     *
     * ⚠️ THIS IS WHERE THE BUG IS MOST VISIBLE ⚠️
     *
     * WHAT'S HAPPENING:
     * 1. User says: "Actually that was lunch not breakfast"
     * 2. AI calls findRecentMeals and gets back 2 meals
     * 3. AI generates NO TEXT (this is the bug)
     * 4. We fall through to here and try to create a response manually
     *
     * THE PROBLEM WITH THIS FALLBACK:
     * We're trying to be "smart" with code logic, but we don't have enough
     * context to properly identify which meal the user is referring to.
     * The AI SHOULD be the one doing this analysis!
     *
     * EVIDENCE OF THE BUG:
     * From production logs:
     *   🔧 Executing findRecentMeals tool
     *   ✅ Found 2 recent meals from Firestore
     *   ⚠️ AI called tools but generated no text. Providing fallback based on tool type.
     *   🤖 Generated response: I couldn't find any recent meals...
     *
     * The tool found 2 meals, but the fallback logic says it didn't find any!
     *
     * WHY THE FALLBACK FAILS:
     * The structure check `findResult?.result?.meals` might not match the actual
     * structure of toolResults. We need to investigate the actual structure.
     *
     * ============================================================================
     */
    if (!message || !message.trim()) {
      // Extract tool calls and results from the steps
      const toolCalls =
        result.steps?.flatMap((step) => step.toolCalls || []) || [];
      const toolResults =
        result.steps?.flatMap((step) => step.toolResults || []) || [];

      // Log that we're in fallback mode (this shouldn't happen in ideal case)
      console.log(
        "⚠️ AI called tools but generated no text. Providing fallback based on tool type."
      );

      // Check which tool was called and provide appropriate fallback message
      if (toolCalls.some((tc) => tc.toolName === "logMeal")) {
        // AI called logMeal - provide simple confirmation
        const logResult = toolResults.find(
          (tr) => tr.toolName === "logMeal"
        );
        if (logResult?.result?.success === false) {
          message = `❌Failed to log meal: ${logResult.result.message}`;
        } else {
          message = "✅ Your meal has been logged!";
        }
      } else if (
        toolCalls.some((tc) => tc.toolName === "analyzeAndUpdateMeal")
      ) {
        // AI called analyzeAndUpdateMeal - provide confirmation with summary
        const updateResult = toolResults.find(
          (tr) => tr.toolName === "analyzeAndUpdateMeal"
        );
        if (updateResult?.result?.success === false) {
          message = `❌Failed to update meal: ${updateResult.result.message}`;
        } else {
          // Include the AI-generated changesSummary if available
          const summary = updateResult?.result?.changesSummary;
          message = summary
            ? `✅ ${summary}`
            : "✅ Your meal has been updated!";
        }
      } else if (
        toolCalls.some((tc) => tc.toolName === "findRecentMeals")
      ) {
        console.log("findRecentMeals was executed");
        /*
         * ✅ PHASE 5 FIX: Second AI Analysis Step
         *
         * AI called findRecentMeals but didn't generate text. This is expected!
         * Tool calling and analysis need to be SEPARATE steps.
         *
         * NEW WORKFLOW:
         * 1. findRecentMeals returns meals (already happened) ✅
         * 2. Call identifyMealFromContext() to analyze which meal ✅ NEW
         * 3. Generate response describing the meal ✅ NEW
         * 4. User confirms
         * 5. AI calls analyzeAndUpdateMeal (happens in next turn)
         */
        const findResult = toolResults.find(
          (tr) => tr.toolName === "findRecentMeals"
        );

        console.log("=== FINDRESULT DEBUG ===");
        console.log("findResult", JSON.stringify(findResult));
        console.log("findResult exists:", !!findResult);
        console.log("findResult.toolName:", findResult?.toolName);
        console.log(
          "findResult.output exists:",
          !!findResult?.output
        );
        console.log(
          "findResult.output type:",
          typeof findResult?.output
        );
        console.log(
          "findResult.output.meals exists:",
          !!findResult?.output?.meals
        );
        console.log(
          "findResult.output.meals is array:",
          Array.isArray(findResult?.output?.meals)
        );
        console.log(
          "findResult.output.meals length:",
          findResult?.output?.meals?.length
        );
        console.log("=== END DEBUG ===");

        // Check if meals were found
        if (findResult?.output?.meals?.length > 0) {
          console.log(
            `\n✅ findRecentMeals returned ${findResult.output.meals.length} meals`
          );
          console.log(
            "🔄 Starting second AI analysis to identify which meal..."
          );

          // Get the user's current message (what they just said)
          const userIntent =
            messages[messages.length - 1]?.content || "";

          // Call the helper to identify which meal
          const identification = await identifyMealFromContext(
            findResult.output.meals,
            messages.slice(-5), // Last 5 messages for context
            userIntent
          );

          if (identification) {
            // Success! Use the AI-generated response
            message = identification.suggestedResponse;

            // Create a pendingAction to store the mealId for the next turn
            // When user confirms, we can execute the update without re-analysis
            pendingAction = {
              type: "updateMeal",
              mealId: identification.mealId,
              mealType: identification.mealType,
              updateRequest: userIntent, // "I also had coca-cola"
              confidence: identification.confidence,
              expiresAt: Date.now() + 300000, // 5 minute expiry
            };

            console.log(
              `✅ Meal identified: ${identification.mealId} (${identification.confidence} confidence)`
            );
            console.log(`📝 Reasoning: ${identification.reasoning}`);
            console.log(
              `🔄 Created pendingAction (expires in 5 min)`
            );
          } else {
            // Identification failed - ask for clarification
            console.log(
              "⚠️ Could not identify meal - asking user for clarification"
            );
            const mealsList = findResult.output.meals
              .map((meal, idx) => {
                const foodNames = meal.foods
                  .map((f) => f.name)
                  .join(", ");
                const timeStr = new Date(
                  meal.timestamp
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                });
                return `${idx + 1}. ${
                  meal.mealType
                } at ${timeStr}: ${foodNames}`;
              })
              .join("\n");

            message = `I found ${findResult.output.meals.length} recent meals:\n\n${mealsList}\n\nWhich one would you like to update?`;
          }
        } else {
          // No meals found
          console.log("⚠️ findRecentMeals returned no meals");
          message =
            "I couldn't find any recent meals. Could you tell me more about when you ate or what foods you had?";
        }
      } else if (
        toolCalls.some((tc) => tc.toolName === "getDailySummary")
      ) {
        // AI called getDailySummary - provide summary
        const summaryResult = toolResults.find(
          (tr) => tr.toolName === "getDailySummary"
        );
        if (summaryResult?.result?.success === false) {
          message = `❌ Failed to get summary: ${summaryResult.result.message}`;
        } else if (summaryResult?.result) {
          message = `Your daily summary: ${
            summaryResult.result.totalCalories || 0
          } calories logged today.`;
        } else {
          message = "Here's your daily summary.";
        }
      } else {
        // Unknown tool or no tools called
        message = "✅ Done!";
      }
    }

    // Log the final response we're sending
    console.log(
      "🤖 Generated response:",
      message.substring(0, 100) + "..."
    );

    // Return JSON response to the mobile app
    res.json({
      // The text message to display to the user
      message,

      // Token usage statistics (for monitoring costs)
      usage: result.usage,

      // List of tool calls made (for debugging)
      toolCalls:
        result.steps
          ?.filter((step) => step.toolCalls)
          .flatMap((step) => step.toolCalls) || [],

      // Pending action for next turn (if meal identified but not yet confirmed)
      // Frontend will store this and send it back when user responds
      // Returns null if: no action pending, action expired, or action was executed/rejected
      pendingAction: isPendingActionValid(pendingAction)
        ? pendingAction
        : null,
    });
  } catch (error) {
    // If anything goes wrong during the entire process
    console.error("❌ Chat API error:", error);

    // Return 500 Internal Server Error
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

/*
 * ============================================================================
 * START THE SERVER
 * ============================================================================
 *
 * Listen for incoming HTTP requests on the specified port.
 * Railway automatically sets the PORT environment variable.
 *
 * ============================================================================
 */
app.listen(PORT, () => {
  // Log that the server started successfully
  console.log(`🚀 Ninety API server running on port ${PORT}`);

  // Log whether OpenAI API key is configured (for debugging)
  console.log(
    `🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`
  );
});
