# Server.js - Complete Code Explanation

**Last Updated:** 2025-11-05
**Purpose:** Detailed line-by-line explanation of server.js to help understand how the food logging system works

---

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Key Sections Explained](#key-sections-explained)
4. [Identified Issues](#identified-issues)

---

## Overview

### What This Server Does (In Simple Terms)

Imagine this server as a smart assistant that:
1. **Listens** to messages from your phone app
2. **Thinks** using OpenAI GPT-4 about what you're asking
3. **Takes Actions** like saving your meal to a database
4. **Responds** back to your phone with helpful information

### The Flow of a Typical Request

```
Phone App → Server → AI (GPT-4) → Tool (save meal) → Database → Server → Phone App
```

**Example:**
1. You say: "I had 2 eggs for breakfast"
2. Server receives this message
3. AI understands: User wants to log a meal
4. AI calls the `logMeal` tool
5. Tool saves meal to Firestore database
6. Server sends back: "✅ Your meal has been logged!"

---

## File Structure

The server.js file has these main sections:

1. **Lines 1-112:** Imports and Initialization
2. **Lines 113-157:** File Upload Configuration
3. **Lines 158-289:** System Prompt (Instructions for AI)
4. **Lines 290-350:** Mock Database (for testing)
5. **Lines 351-412:** logMeal Tool
6. **Lines 413-481:** findRecentMeals Tool
7. **Lines 482-570:** updateMeal Tool
8. **Lines 571-651:** getDailySummary Tool
9. **Lines 652-792:** Main Chat API Endpoint
10. **Lines 793-890:** Transcription API Endpoint

---

## Key Sections Explained

### Section 1: System Prompt (Lines 158-289)

**What is a System Prompt?**
Think of it as a detailed instruction manual for the AI. It tells the AI:
- What its role is (fitness coach named Ava)
- How to behave
- What tools it can use
- Step-by-step workflows to follow

**Key Parts:**

#### Food Logging Instructions (Lines 115-147)

```
User says: "I had eggs for breakfast"
AI must:
1. Ask how they were prepared (scrambled, fried, etc.)
2. Estimate calories and macros
3. Show breakdown to user
4. Ask for confirmation
5. ONLY THEN call logMeal tool
```

**Why the confirmation step?**
We don't want the AI to automatically log without checking with the user first. User might want to correct something.

#### Editing Previous Meals (Lines 148-234)

This is the workflow we're currently debugging!

**The INTENDED Workflow:**
```
User: "Actually that was lunch not breakfast"

Step 1: AI calls findRecentMeals tool
  → Gets back: [{id: "abc123", mealType: "breakfast", foods: ["eggs"], ...}]

Step 2: AI analyzes results
  → AI thinks: "User just logged eggs for breakfast, that must be the meal"

Step 3: AI describes what it found
  → AI says: "I found your breakfast from 9:00 AM with 2 eggs (180 cal)..."

Step 4: AI asks for confirmation
  → AI asks: "Should I change this to lunch?"

Step 5: User confirms
  → User says: "Yes"

Step 6: AI calls updateMeal tool
  → updateMeal({mealId: "abc123", mealType: "lunch"})

Step 7: AI confirms success
  → AI says: "✅ Updated! Your meal is now logged as lunch"
```

**THE PROBLEM:**
Steps 2-4 are NOT happening! The AI is calling findRecentMeals but not analyzing the results.

---

### Section 2: findRecentMeals Tool (Lines 413-481)

**Purpose:** Find recent meals from the database so the AI can see what the user has logged.

**Line-by-Line Breakdown:**

```javascript
// Lines 413-419: Tool definition and parameters
findRecentMeals: tool({
  description: 'Find recent meals...', // Tells AI when to use this tool
  inputSchema: z.object({
    containsFood: z.string().optional(),  // Optional: search for specific food
    limit: z.number().optional(),  // Optional: how many meals to return
  }),
```

**What this means:**
The AI can call this tool in two ways:
- `findRecentMeals()` - Get last 10 meals
- `findRecentMeals({ containsFood: "eggs" })` - Get meals containing eggs

```javascript
// Lines 420-422: Execute function starts
execute: async ({ containsFood, limit }, { abortSignal }) => {
  console.log('🔧 Executing findRecentMeals tool');

  // Get the current user's ID from a global variable
  // This variable is set in the main chat endpoint (line 660)
  const userId = global.currentUserId || 'anonymous';
```

**Global variable?**
`global.currentUserId` is set when the chat request comes in. This lets the tool know which user's meals to search for.

```javascript
// Lines 429-440: Mock database fallback
// ⚠️ ISSUE: This should NOT be in production!
if (!db) {
  console.warn('⚠️  Firestore not available, using mock database');
  // ... uses fake data instead of real database
}
```

**THE PROBLEM with this code:**
If Firestore is down, the app uses fake data instead of failing. This is dangerous because:
- User might think their meals are saved when they're not
- Creates inconsistency between what AI thinks happened and reality
- Should be removed for production

```javascript
// Lines 442-444: Build the Firestore query
try {
  // Get reference to the user's meals collection
  // Path in Firestore: nutrition/{userId}/meals
  const mealsRef = db.collection('nutrition').doc(userId).collection('meals');

  // Create query:
  // - Order by 'createdAt' field (newest first)
  // - Limit to 10 meals (or whatever was specified)
  let query = mealsRef.orderBy('createdAt', 'desc').limit(limit || 10);
```

**Why orderBy('createdAt')?**
- Every meal has a `createdAt` timestamp set by Firestore
- This field is automatically indexed (fast to query)
- We want newest meals first (desc = descending order)

```javascript
// Line 446: Execute the query
const snapshot = await query.get();
```

**What is a snapshot?**
It's the query results from Firestore. Contains all the meal documents that match our query.

```javascript
// Lines 447-471: Process the results
let meals = [];

// Loop through each document (meal) in the results
snapshot.forEach(doc => {
  // Get all the data fields from this meal document
  const data = doc.data();

  // CLIENT-SIDE FILTERING (if containsFood was specified)
  if (containsFood) {
    // Check if any food in this meal matches the search term
    const hasFood = data.foods?.some(f =>
      f.name.toLowerCase().includes(containsFood.toLowerCase())
    );
    // If no match, skip this meal
    if (!hasFood) return;
  }

  // Add this meal to our results array
  meals.push({
    id: doc.id,  // ✅ Firestore document ID (needed for updates!)
    mealType: data.mealType,  // breakfast/lunch/dinner/snack
    timestamp: data.timestamp?.toDate().toISOString() || data.createdAt?.toDate().toISOString(),
    foods: data.foods || [],  // Array of food items with macros
    totalCalories: data.totalCalories || 0,
    totalProtein: data.totalProtein || 0,
    totalCarbs: data.totalCarbs || 0,
    totalFats: data.totalFats || 0,
    totalFiber: data.totalFiber || 0,
    notes: data.notes || '',
  });
});
```

**Important note about `id: doc.id`:**
This is the unique Firestore document ID. The `updateMeal` tool NEEDS this ID to know which meal to update!

```javascript
// Lines 474-476: Return the results
console.log(`✅ Found ${meals.length} recent meals from Firestore`);
return { meals };  // Returns an object with a 'meals' array
```

**The Return Structure:**
```javascript
{
  meals: [
    {
      id: "abc123",
      mealType: "breakfast",
      timestamp: "2025-11-05T10:00:00.000Z",
      foods: [...],
      totalCalories: 180,
      ...
    },
    {
      id: "def456",
      mealType: "lunch",
      ...
    }
  ]
}
```

---

### Section 3: Main Chat API Endpoint (Lines 652-792)

This is where the magic happens! When your phone app sends a message, this is the function that handles it.

**Line-by-Line Breakdown:**

```javascript
// Lines 652-653: Define the API endpoint
app.post('/api/chat', async (req, res) => {
  console.log('🚀 Railway API: POST /api/chat called');
```

**What is an API endpoint?**
It's like a mailbox address. Your phone app sends messages to `https://ninety-production.up.railway.app/api/chat` and this function receives them.

```javascript
// Lines 654-662: Extract data from the request
try {
    // Get the message history and user ID from the phone app
    const { messages, userId, recentMealsContext = [] } = req.body;

    // Store userId in a global variable so tools can access it
    // (tools need to know which user's data to read/write)
    global.currentUserId = userId;

    // Log the messages for debugging
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
```

**What are `messages`?**
It's the conversation history. Example:
```javascript
[
  {role: "assistant", content: "Hi! I'm Ava..."},
  {role: "user", content: "I had 2 eggs for breakfast"},
  {role: "assistant", content: "Great! Should I log this?"},
  {role: "user", content: "Yes"}
]
```

```javascript
// Lines 671-718: Call the AI with tools
const result = await generateText({
  // Use OpenAI GPT-4o-mini model
  model: openai('gpt-4o-mini'),

  // Send the system prompt (instructions for AI) + conversation history
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ],

  // Give the AI access to these tools (functions it can call)
  tools: {
    logMeal,
    findRecentMeals,
    updateMeal,
    getDailySummary,
  },

  // Allow AI to use tools automatically
  toolChoice: 'auto',

  // Maximum number of back-and-forth steps
  // (AI can call multiple tools in sequence)
  maxSteps: 10,

  // Temperature controls randomness (0.7 = balanced)
  temperature: 0.7,
});
```

**What happens during this call?**

1. AI reads the system prompt and conversation
2. AI decides if it needs to call a tool
3. If yes:
   - AI calls the tool (e.g., `findRecentMeals()`)
   - Tool executes and returns results
   - AI reads the results
   - AI decides what to do next (call another tool? respond to user?)
4. Eventually AI generates a text response
5. The `result` object contains the AI's response and any tool calls made

```javascript
// Lines 720-766: Extract the AI's response
console.log('✅ AI request successful');

// Try to get the message text from the AI's response
let message = result.text || "";

// PROBLEM: Sometimes AI calls tools but doesn't generate text!
// When this happens, we need to create a fallback message
if (!message || !message.trim()) {
  // Extract all the tool calls and results from the AI's execution steps
  const toolCalls = result.steps?.flatMap(step => step.toolCalls || []) || [];
  const toolResults = result.steps?.flatMap(step => step.toolResults || []) || [];

  console.log('⚠️ AI called tools but generated no text. Providing fallback based on tool type.');

  // Check which tool was called and provide appropriate fallback message
  if (toolCalls.some(tc => tc.toolName === 'findRecentMeals')) {
    // AI searched for meals - check if any were found
    const findResult = toolResults.find(tr => tr.toolName === 'findRecentMeals');

    // ⚠️ CRITICAL ISSUE: This is where the bug is!
    // We're checking findResult?.result?.meals
    // But the actual structure might be different
    if (findResult?.result?.meals?.length > 0) {
      const meal = findResult.result.meals[0];
      message = `I found your ${meal.mealType} from ...`;
    } else {
      message = "I couldn't find any recent meals...";
    }
  }
}
```

**THE BUG:**
From your logs, we see:
```
✅ Found 2 recent meals from Firestore
⚠️ AI called tools but generated no text. Providing fallback based on tool type.
🤖 Generated response: I couldn't find any recent meals...
```

So the tool DID find meals, but the fallback logic says it didn't!

**Possible reasons:**
1. The structure of `toolResults` is different than we expect
2. `findResult?.result?.meals` is undefined even though meals exist
3. The AI generated text but it's in a different location in the result object

---

## Identified Issues

### Issue 1: AI Not Analyzing findRecentMeals Results

**Current Behavior:**
```
1. User: "Actually that was lunch"
2. AI calls findRecentMeals → Gets 2 meals back
3. AI generates NO TEXT ❌
4. Fallback says: "I couldn't find any recent meals" ❌
```

**Expected Behavior:**
```
1. User: "Actually that was lunch"
2. AI calls findRecentMeals → Gets 2 meals back
3. AI READS the results ✅
4. AI identifies which meal user means ✅
5. AI says: "I found your breakfast with eggs from 9:00 AM..." ✅
6. AI asks: "Should I update this to lunch?" ✅
```

**Root Cause:**
The AI is not generating text after calling `findRecentMeals`. The fallback logic tries to compensate but doesn't have enough context.

**Your Proposed Solution:**
Add a second AI analysis step:
1. First call: `findRecentMeals` returns all recent meals
2. Second AI call: Pass the meals to AI and ask "Which meal is the user referring to?"
3. AI analyzes conversation context + meal data
4. AI returns the specific meal ID
5. Then proceed with update

---

### Issue 2: Mock Database in Production Code

**Location:** Lines 429-440 (findRecentMeals), similar patterns in other tools

**The Problem:**
```javascript
if (!db) {
  console.warn('⚠️  Firestore not available, using mock database');
  // Returns fake data instead of failing
}
```

**Why This Is Bad:**
- If Firestore goes down, app silently uses fake data
- User thinks their meals are saved but they're not
- Creates inconsistent state

**Solution:**
Remove mock database logic. If Firestore is unavailable, the app should fail with a clear error message.

---

### Issue 3: Fallback Logic Structure Mismatch

**Location:** Lines 743-754

**The Problem:**
```javascript
const findResult = toolResults.find(tr => tr.toolName === 'findRecentMeals');
if (findResult?.result?.meals?.length > 0) {
  // Show meal found
} else {
  // Show "couldn't find" ❌ This is being triggered wrongly
}
```

The tool returns `{ meals: [...] }` but we're checking `findResult?.result?.meals` (extra `.result`).

**Need to investigate:**
What is the actual structure of `findResult`? We need to add logging to see:
```javascript
console.log('🔍 DEBUG findResult structure:', JSON.stringify(findResult, null, 2));
```

---

### Issue 4: `containsFood` Filter Is Premature

**Location:** Lines 453-458

```javascript
if (containsFood) {
  const hasFood = data.foods?.some(f =>
    f.name.toLowerCase().includes(containsFood.toLowerCase())
  );
  if (!hasFood) return;
}
```

**The Problem:**
We're trying to be smart with code-based filtering. But the AI should be the one deciding which meals are relevant based on conversation context, not a simple string match.

**Your Insight:**
Let AI analyze ALL recent meals and use its intelligence to identify which one the user is referring to.

---

## Next Steps

1. **Add Debug Logging**
   Add detailed logs to see:
   - What structure `toolResults` actually has
   - Why the fallback thinks meals weren't found
   - What the AI is seeing after calling tools

2. **Implement Second AI Analysis Step**
   When findRecentMeals returns results:
   - Make a second AI call
   - Pass meals + conversation history
   - Ask AI to identify which specific meal
   - Use that meal ID for updates

3. **Remove Mock Database Logic**
   Production app should fail loudly if Firestore is unavailable

4. **Add Comments to server.js**
   Continue adding inline comments for every section

---

## Questions to Investigate

1. Why is AI generating empty text after calling findRecentMeals?
2. What is the exact structure of `toolResults` when a tool is called?
3. Should we use Vercel AI SDK's multi-step execution differently?
4. Is there a way to force the AI to always generate text after tool calls?

---

**End of Document**
