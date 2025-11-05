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

const { openai } = require("@ai-sdk/openai"); // OpenAI integration for Vercel AI SDK

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
 * 4. THEN call updateMeal
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
 * MOCK DATABASE (FOR TESTING ONLY)
 * ============================================================================
 *
 * ⚠️ CRITICAL ISSUE: This should NOT be in production code!
 *
 * This is an in-memory fake database that only exists while the server is running.
 * If the server restarts, all data is lost.
 *
 * WHY IT EXISTS: For local development when Firestore credentials aren't configured.
 *
 * WHY IT'S DANGEROUS: If Firestore goes down in production, the app silently
 * uses this mock database instead, and users think their meals are saved when
 * they're actually lost.
 *
 * TODO: Remove all references to mockMealsDB for production deployment.
 *
 * ============================================================================
 */
const mockMealsDB = {};

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
        .describe("ISO timestamp of when meal was eaten"),

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

      /*
       * ⚠️ ISSUE: MOCK DATABASE FALLBACK IN PRODUCTION
       *
       * See comment above about mockMealsDB - this should be removed!
       */
      if (!db) {
        console.warn(
          "⚠️  Firestore not available, using mock database"
        );

        // Generate a fake meal ID
        const mealId = `meal_${Date.now()}`;

        // Initialize array for this user if it doesn't exist
        if (!mockMealsDB[userId]) mockMealsDB[userId] = [];

        // Add meal to in-memory mock database
        mockMealsDB[userId].push({
          id: mealId,
          mealType,
          foods,
          timestamp,
          notes,
        });

        console.log("✅ Meal logged to mock:", mealId);
        return {
          success: true,
          mealId,
          message: "Meal logged successfully",
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
        const mealData = {
          // Meal type (breakfast/lunch/dinner/snack)
          mealType,

          // Convert ISO string to Firestore Timestamp
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(timestamp)
          ),

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
   * 6. AI should then call updateMeal with the real meal ID
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
      "Find recent meals for context. REQUIRED before calling updateMeal. Use when user references a previous meal or wants to edit. Returns actual meal IDs needed for updates.",

    // Define what parameters this tool accepts
    inputSchema: z.object({
      // Optional: filter meals to only those containing this food
      // Example: containsFood: "eggs" will only return meals with eggs
      containsFood: z
        .string()
        .optional()
        .describe("Search for meals containing this food item"),

      // Optional: how many meals to return (default is 10)
      limit: z
        .number()
        .optional()
        .describe("Maximum number of meals to return (default: 10)"),
    }),

    // This function executes when AI calls the tool
    execute: async ({ containsFood, limit }, { abortSignal }) => {
      // Log that this tool is being executed
      console.log("🔧 Executing findRecentMeals tool");

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      /*
       * ⚠️ ISSUE: MOCK DATABASE FALLBACK IN PRODUCTION
       *
       * This code checks if Firestore is available, and if not, uses fake data.
       * This is DANGEROUS in production because:
       * - If Firestore goes down, user thinks their data is saved but it's not
       * - Creates inconsistent state
       * - Should FAIL LOUDLY instead of silently using mock data
       *
       * TODO: Remove this entire if block for production
       */
      if (!db) {
        console.warn(
          "⚠️  Firestore not available, using mock database"
        );

        // Get this user's meals from the in-memory mock database
        const userMeals = mockMealsDB[userId] || [];

        // Filter meals if containsFood was specified
        const filtered = userMeals
          .filter((meal) => {
            if (containsFood) {
              // Check if any food in this meal matches the search
              const hasFood = meal.foods.some((f) =>
                f.name
                  .toLowerCase()
                  .includes(containsFood.toLowerCase())
              );
              // If no match, exclude this meal
              if (!hasFood) return false;
            }
            return true;
          })
          .slice(0, limit || 10); // Limit to requested number of meals

        console.log(
          `✅ Found ${filtered.length} recent meals from mock`
        );

        // Return meals wrapped in an object
        return { meals: filtered };
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

          /*
           * CLIENT-SIDE FILTERING (if containsFood was specified)
           *
           * ⚠️ ISSUE: This is premature optimization. We're trying to be
           * "smart" with code-based filtering, but the AI should analyze
           * ALL recent meals and use its intelligence to determine which
           * one the user is referring to based on conversation context.
           *
           * TODO: Consider removing this filter and letting AI decide
           */
          if (containsFood) {
            // Check if any food in this meal matches the search term
            const hasFood = data.foods?.some((f) =>
              f.name
                .toLowerCase()
                .includes(containsFood.toLowerCase())
            );
            // If no match, skip this meal
            if (!hasFood) return;
          }

          // Add this meal to our results array
          meals.push({
            // ✅ CRITICAL: Include the Firestore document ID
            // This is what updateMeal needs to know which meal to update
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
   * TOOL: updateMeal
   * ============================================================================
   *
   * PURPOSE:
   * Modify an existing meal in the database (change meal type, edit foods, etc.)
   *
   * WHEN AI USES THIS:
   * - User says: "Actually that was lunch not breakfast"
   * - User says: "I only had 1 egg not 2"
   * - User says: "Add toast to my breakfast"
   *
   * CRITICAL REQUIREMENT:
   * The AI MUST call findRecentMeals FIRST to get the real meal ID.
   * This tool will reject placeholder IDs like "abc123" or "xyz789".
   *
   * WHY THIS IS IMPORTANT:
   * Firestore meal IDs look like: "meal_1730823456789_4aBcXyZ"
   * If the AI guesses or makes up an ID, it won't find the meal in the database.
   *
   * ⚠️ CURRENT BUG:
   * The AI isn't calling this tool because it's not completing the workflow
   * from findRecentMeals (it generates empty text instead of asking for confirmation).
   *
   * ============================================================================
   */
  updateMeal: tool({
    // Description tells the AI when and how to use this tool
    description:
      "Update an existing meal. CRITICAL: You MUST call findRecentMeals first to get the meal ID. NEVER use placeholder IDs. Only use IDs from findRecentMeals results.",

    // Define parameters (all updates are optional except mealId)
    inputSchema: z.object({
      // The Firestore document ID (MUST come from findRecentMeals)
      mealId: z
        .string()
        .describe(
          'The meal ID from findRecentMeals (NEVER use placeholders like "xyz789" or "abc123")'
        ),

      // Optional: new foods array (replaces existing foods completely)
      foods: z
        .array(
          z.object({
            name: z.string(),
            quantity: z.string(),
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fats: z.number(),
            fiber: z.number(),
          })
        )
        .optional()
        .describe("Updated foods array"),

      // Optional: new notes
      notes: z.string().optional().describe("Updated notes"),

      // Optional: change meal type (breakfast → lunch, etc.)
      mealType: z
        .enum(["breakfast", "lunch", "dinner", "snack"])
        .optional()
        .describe("Updated meal type"),
    }),

    // This function executes when AI calls the tool
    execute: async (
      { mealId, foods, notes, mealType },
      { abortSignal }
    ) => {
      // Log what meal ID we're trying to update
      console.log(
        "🔧 Executing updateMeal tool with mealId:",
        mealId
      );

      /*
       * VALIDATION: Reject placeholder IDs
       *
       * Sometimes AI models try to be "clever" and make up IDs instead of
       * calling findRecentMeals first. This catches that mistake.
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
       *
       * Real Firestore IDs are long (20+ characters).
       * If the ID is short, it's probably fake.
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

      /*
       * ⚠️ ISSUE: MOCK DATABASE FALLBACK IN PRODUCTION
       *
       * See previous comments about mockMealsDB - this should be removed!
       */
      if (!db) {
        console.warn(
          "⚠️  Firestore not available, using mock database"
        );

        // Find the meal in the mock database
        const userMealsList = mockMealsDB[userId] || [];
        const mealIndex = userMealsList.findIndex(
          (m) => m.id === mealId
        );

        // If meal exists in mock, update it
        if (mealIndex >= 0) {
          const updates = {};
          if (foods) updates.foods = foods;
          if (notes) updates.notes = notes;
          if (mealType) updates.mealType = mealType;

          // Merge updates into existing meal
          userMealsList[mealIndex] = {
            ...userMealsList[mealIndex],
            ...updates,
          };

          console.log("✅ Meal updated in mock:", mealId);
          return {
            success: true,
            message: "Meal updated successfully",
          };
        }

        // Meal not found in mock
        return { success: false, message: "Meal not found" };
      }

      // If we reach here, Firestore IS available
      try {
        // Get reference to the specific meal document
        // Path: nutrition/{userId}/meals/{mealId}
        const mealRef = db
          .collection("nutrition")
          .doc(userId)
          .collection("meals")
          .doc(mealId);

        // Build the updates object (only include fields that were provided)
        const updates = {};

        /*
         * IF FOODS ARE UPDATED: Recalculate total macros
         *
         * When the foods array changes, we need to recalculate all the totals.
         * This ensures totalCalories, totalProtein, etc. stay in sync.
         */
        if (foods) {
          // Sum up all the macros from the foods array
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

          // Add both the foods array and the totals to the updates
          updates.foods = foods;
          updates.totalCalories = totals.calories;
          updates.totalProtein = totals.protein;
          updates.totalCarbs = totals.carbs;
          updates.totalFats = totals.fats;
          updates.totalFiber = totals.fiber;
        }

        // If notes were provided, update them
        if (notes !== undefined) {
          updates.notes = notes;
        }

        // If meal type was changed, update it
        if (mealType !== undefined) {
          updates.mealType = mealType;
        }

        // Add timestamp for when this update happened
        updates.updatedAt =
          admin.firestore.FieldValue.serverTimestamp();

        // Apply the updates to Firestore
        await mealRef.update(updates);

        // Log success
        console.log("✅ Meal updated in Firestore:", mealId);
        return {
          success: true,
          message: "Meal updated successfully",
        };
      } catch (error) {
        // If something goes wrong (meal doesn't exist, network error, etc.)
        console.error("❌ Error updating meal in Firestore:", error);
        return { success: false, message: `Error: ${error.message}` };
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

      /*
       * ⚠️ ISSUE: MOCK DATABASE FALLBACK IN PRODUCTION
       *
       * See previous comments about mockMealsDB - this should be removed!
       */
      if (!db) {
        console.warn(
          "⚠️  Firestore not available, using mock database"
        );

        // Get all meals for this user from mock database
        const todayMeals = mockMealsDB[userId] || [];

        // Calculate total calories by summing up all foods in all meals
        const total = todayMeals.reduce((sum, m) => {
          const mealCal = m.foods.reduce((s, f) => s + f.calories, 0);
          return sum + mealCal;
        }, 0);

        console.log("✅ Daily summary from mock:", total, "calories");
        return {
          totalCalories: total,
          calorieTarget: 2400,
          progress: total / 2400,
          mealsCount: todayMeals.length,
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
    const { messages, userId, recentMealsContext } = req.body;

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
     * - The available tools (logMeal, findRecentMeals, updateMeal, getDailySummary)
     *
     * HOW MULTI-STEP EXECUTION WORKS:
     * 1. AI reads the message and decides if it needs to call a tool
     * 2. If yes, AI calls the tool (e.g., findRecentMeals)
     * 3. Tool executes and returns results
     * 4. AI reads the tool results
     * 5. AI decides what to do next:
     *    - Call another tool? (e.g., updateMeal)
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
      // Which AI model to use (gpt-4o-mini is faster and cheaper)
      model: openai("gpt-4o-mini"),

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
          message = `❌ Failed to log meal: ${logResult.result.message}`;
        } else {
          message = "✅ Your meal has been logged!";
        }
      } else if (
        toolCalls.some((tc) => tc.toolName === "updateMeal")
      ) {
        // AI called updateMeal - provide simple confirmation
        const updateResult = toolResults.find(
          (tr) => tr.toolName === "updateMeal"
        );
        if (updateResult?.result?.success === false) {
          message = `❌ Failed to update meal: ${updateResult.result.message}`;
        } else {
          message = "✅ Your meal has been updated!";
        }
      } else if (
        toolCalls.some((tc) => tc.toolName === "findRecentMeals")
      ) {
        /*
         * ⚠️ THIS IS THE PROBLEMATIC SECTION ⚠️
         *
         * AI called findRecentMeals but didn't generate text describing what it found.
         * We try to create a fallback message, but this is where the bug manifests.
         *
         * THE ISSUE:
         * From logs, we see:
         *   ✅ Found 2 recent meals from Firestore
         * But the fallback says:
         *   I couldn't find any recent meals...
         *
         * This means `findResult?.result?.meals` is not finding the meals even
         * though they exist in toolResults.
         *
         * TODO: Add debug logging to see actual structure of findResult
         */
        const findResult = toolResults.find(
          (tr) => tr.toolName === "findRecentMeals"
        );

        // Check if meals were found
        if (findResult?.result?.meals?.length > 0) {
          // Meals found - describe the first one
          const meal = findResult.result.meals[0];
          const foodNames = meal.foods.map((f) => f.name).join(", ");
          const timeStr = new Date(meal.timestamp).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            }
          );
          message = `I found your ${meal.mealType} from ${timeStr} with ${foodNames} (${meal.totalCalories} cal). What changes would you like me to make?`;
        } else {
          // No meals found (or structure mismatch)
          message =
            "I couldn't find any recent meals matching your request. Could you tell me more about when you ate or what foods you had?";
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
