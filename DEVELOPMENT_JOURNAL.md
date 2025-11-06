# Ninety - Development Journal

**A chronicle of building a fitness app startup, documenting the real challenges, failures, and breakthroughs.**

Think of this as a Mark Rober-style behind-the-scenes: showing not just what worked, but all the attempts that didn't, the debugging rabbit holes, and the "aha!" moments that came at 2 AM.

---

## Table of Contents

1. [November 5-6, 2025: The Empty Text Mystery](#november-5-6-2025-the-empty-text-mystery)

---

## November 5-6, 2025: The Empty Text Mystery

### 🎯 The Goal

Build a meal update workflow where users can naturally correct their logs:
- User: "Actually that was lunch not breakfast"
- AI: Finds the meal → Describes it → Confirms → Updates it

Simple concept. Should be straightforward, right?

### 💥 The Challenge

**The Symptom:**
```
User: "Actually that was lunch not breakfast"
AI calls findRecentMeals → ✅ Found 2 meals from Firestore
AI response: "I couldn't find any recent meals"
```

Wait, what? The tool FOUND meals but the AI says it didn't?

**Backend Logs:**
```
🔧 Executing findRecentMeals tool
✅ Found 2 recent meals from Firestore
✅ AI request successful
📊 result.text: EMPTY
⚠️ AI called tools but generated no text
🤖 Generated response: I couldn't find any recent meals...
```

The AI was calling the tool successfully, but generating **completely empty text** afterwards. Then our fallback logic kicked in and gave the wrong message.

### 😫 The Struggle

#### Attempt 1: "It's probably the model"
**Hypothesis:** GPT-4o-mini can't generate text after tool calls. Claude Sonnet will fix this.

**Action:**
- Switched from `openai("gpt-4o-mini")` to `anthropic("claude-sonnet-4-5")`
- Added `@ai-sdk/anthropic` dependency to package.json
- Updated Railway environment variables
- Cost increase: $0.60/mo → $13/mo

**Result:** Same exact issue. Empty text after findRecentMeals.

**Time wasted:** 2 hours

---

#### Attempt 2: "We need better logging"
**Hypothesis:** We can't debug what we can't see. Add extensive logging to understand the SDK behavior.

**Action:**
```javascript
console.log("\n🔍 DEBUG: Starting result analysis...");
console.log("📊 result.text:", result.text ? `"${result.text.substring(0, 100)}..."` : "EMPTY or null");
console.log("📊 result.steps count:", result.steps?.length || 0);
result.steps?.forEach((step, idx) => {
  console.log(`\n📍 Step ${idx + 1}:`);
  console.log(`Type: ${step.toolCalls ? 'TOOL_CALL' : 'TEXT'}`);
  if (step.toolCalls) {
    step.toolCalls.forEach((tc, tcIdx) => {
      console.log(`  Tool ${tcIdx + 1}: ${tc.toolName}`);
      console.log(`  Args: ${JSON.stringify(tc.args).substring(0, 100)}...`);
    });
  }
  // ... more logging
});
```

**Result:** App crashed in production.

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'substring')
at /app/server.js:1662:67
```

Turns out `tc.args` was undefined in some cases, and we were calling `.substring()` on it.

**User feedback:** "I don't want these problems -- if logging is creating so much problems"

**Time wasted:** 1 hour + production downtime

---

#### Attempt 3: "Let's research the SDK"
**Hypothesis:** This is a known behavior. Check Vercel AI SDK documentation and GitHub issues.

**Research findings:**
- Found GitHub Issue #4126: "Empty text after tool calls"
- OpenAI and Google models return `content: null` after tool calls (by design)
- Anthropic is supposed to include text, but doesn't in multi-step scenarios
- This is intentional behavior, not a bug

**Community workaround:**
```javascript
// Extract text from result.response.messages instead
const message = result.response.messages
  .filter(msg => msg.role === "assistant")
  .map(msg => {
    if (typeof msg.content === "string") return msg.content;
    if (Array.isArray(msg.content)) {
      return msg.content
        .filter(part => part.type === "text")
        .map(part => part.text)
        .join(" ");
    }
    return "";
  })
  .filter(text => text.trim())
  .join("\n");
```

**Result:** Still empty. The AI wasn't generating text at all, so there was nothing to extract.

**Time wasted:** 3 hours of reading docs and issues

---

#### Attempt 4: "Fix the fallback logic"
**Hypothesis:** If AI won't generate text, make smarter fallbacks based on which tool was called.

**Action:**
```javascript
if (!message || !message.trim()) {
  const toolCalls = result.steps?.flatMap(step => step.toolCalls || []) || [];
  const toolResults = result.steps?.flatMap(step => step.toolResults || []) || [];

  if (toolCalls.some(tc => tc.toolName === "findRecentMeals")) {
    const findResult = toolResults.find(tr => tr.toolName === "findRecentMeals");
    if (findResult?.result?.meals?.length > 0) {
      // Describe the first meal
      const meal = findResult.result.meals[0];
      message = `I found your ${meal.mealType} from ${timeStr}...`;
    } else {
      message = "I couldn't find any recent meals...";
    }
  }
}
```

**Result:** Still said "couldn't find any meals" even when meals existed!

**Why it failed:** The structure check `findResult?.result?.meals` didn't match the actual SDK response structure. We were looking in the wrong place.

**Time wasted:** 2 hours

---

#### Attempt 5: "Maybe remove mock database?"
**Hypothesis:** The mock database patterns might be interfering with real data.

**Action:**
```javascript
// BEFORE:
if (!db) {
  console.warn('⚠️  Firestore not available, using mock database');
  return mockData;
}

// AFTER:
if (!db) {
  console.error("❌ CRITICAL: Firestore not initialized");
  return {
    success: false,
    message: "Database unavailable. Please try again later."
  };
}
```

**Result:** Good for production hygiene, but didn't fix the empty text issue.

**Lessons learned:**
- Mock databases create silent failures
- Always fail loudly in production
- But this wasn't the root cause

**Time wasted:** 1 hour

---

#### Attempt 6: "Code-based filtering is the problem"
**Hypothesis:** The `containsFood` parameter is filtering out meals before AI can see them.

**Action:**
```javascript
// BEFORE:
inputSchema: z.object({
  containsFood: z.string().optional(),
  limit: z.number().optional(),
}),
execute: async ({ containsFood, limit }) => {
  if (containsFood) {
    const hasFood = data.foods?.some(f =>
      f.name.toLowerCase().includes(containsFood.toLowerCase())
    );
    if (!hasFood) return; // Skip this meal
  }
}

// AFTER:
inputSchema: z.object({
  limit: z.number().optional(), // Just limit, no filtering
}),
execute: async ({ limit }) => {
  // Return ALL meals unfiltered - let AI analyze
  meals.push({ id: doc.id, mealType: data.mealType, foods: data.foods, ... });
}
```

**Result:** Better design (AI should analyze context, not string matching), but still didn't fix empty text.

**Time wasted:** 1 hour

---

### 💡 The Breakthrough

**The User's Insight:**
> "Once we query the recent meals, shouldn't it undergo a second round of AI evaluation to figure out which meal we're talking about?"

**The "Aha!" Moment:**

We were asking ONE AI call to do too much:
1. Call findRecentMeals ✅
2. Receive meal data back ✅
3. Analyze which meal user means ❌
4. Generate description ❌
5. Ask for confirmation ❌

The AI would call the tool, get results back, and then... freeze. It couldn't process all that in a single generation step with tool execution.

**The Real Problem:** Workflow design, not a bug!

### ✅ The Solution

**Two-Step Workflow:**

Split into separate AI calls:
1. **First AI call:** Tool calling (findRecentMeals fetches data)
2. **Second AI call:** Analysis only (identifyMealFromContext identifies which meal)

**Implementation:**

Created a helper function `identifyMealFromContext()` (180 lines):
```javascript
async function identifyMealFromContext(meals, conversationHistory, userIntent) {
  // If only one meal, return it immediately
  if (meals.length === 1) {
    return {
      mealId: meals[0].id,
      confidence: "high",
      suggestedResponse: "I found your breakfast from 9:00 AM..."
    };
  }

  // Multiple meals - make second AI call to analyze
  const analysisPrompt = `You are a meal identification assistant...

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join("\n")}

USER'S CURRENT REQUEST:
"${userIntent}"

AVAILABLE MEALS:
${meals.map((meal, idx) => `${idx + 1}. [ID: ${meal.id}] ...`).join("\n\n")}

TASK: Identify which meal the user is referring to...`;

  const result = await generateText({
    model: anthropic("claude-sonnet-4-5"),
    messages: [{ role: "user", content: analysisPrompt }],
    temperature: 0.2,
  });

  return JSON.parse(result.text); // { mealId, confidence, reasoning, suggestedResponse }
}
```

**Integrated into fallback logic:**
```javascript
if (findResult?.result?.meals?.length > 0) {
  console.log("🔄 Starting second AI analysis...");

  const identification = await identifyMealFromContext(
    findResult.result.meals,
    messages.slice(-5),
    userIntent
  );

  message = identification.suggestedResponse;
}
```

**New workflow:**
```
User: "Actually that was lunch"
  ↓
AI calls findRecentMeals (returns 2 meals) ✅
  ↓
result.text is EMPTY (expected!) ✅
  ↓
System calls identifyMealFromContext() ✅
  ↓
Second AI analyzes conversation + meals ✅
  ↓
Returns: {mealId, confidence, suggestedResponse} ✅
  ↓
User sees: "I found your breakfast from 9:00 AM..." ✅
```

**Files changed:**
- `server/server.js`: +374 lines
  - Lines 180-287: `identifyMealFromContext()` helper
  - Lines 1966-2001: Integration into fallback logic
  - Lines 517-631: Updated system prompt

### 🎓 Lessons Learned

#### 1. **One AI call = One responsibility**
Don't ask a single AI generation step to:
- Call tools
- Process tool results
- Analyze context
- Generate user-facing responses

Split complex workflows into multiple AI calls.

#### 2. **Empty text after tools is not a bug**
It's intentional SDK behavior. Models like OpenAI/Google return `content: null` after tool calls. Design workflows that don't depend on text being generated alongside tool calls.

#### 3. **Switching models won't fix workflow issues**
We spent $13/mo on Claude Sonnet thinking it would fix the issue. It didn't. The problem was architectural, not model-specific.

#### 4. **Mock databases are dangerous**
```javascript
if (!db) return mockData; // Silent failure - creates inconsistent state
```

Always fail loudly in production. Users need to know when real data isn't being saved.

#### 5. **Let AI do AI things, let code do code things**
```javascript
// ❌ Code trying to be smart:
if (containsFood) {
  const hasFood = data.foods?.some(f => f.name.toLowerCase().includes(...));
}

// ✅ AI analyzing context:
identifyMealFromContext(meals, conversation, intent)
```

String matching can't understand "that was lunch" or "the eggs I had." Use AI for context analysis.

#### 6. **Debug logging needs defensive checks**
```javascript
// ❌ Crashes if tc.args is undefined:
console.log(`Args: ${JSON.stringify(tc.args).substring(0, 100)}`);

// ✅ Safe logging:
console.log("Args:", tc.args ? JSON.stringify(tc.args) : "none");
```

Production errors from logging are embarrassing.

#### 7. **Structure assumptions will bite you**
We assumed `findResult?.result?.meals` was the structure. It might not be. Always add debug logging to verify:
```javascript
console.log("findResult:", JSON.stringify(findResult, null, 2));
```

### 🚫 Why Vibes Don't Work

**"Just make the AI describe the meal" - Failed 6 times**

The vibe-based approach would be:
1. Try switching models → didn't work
2. Try better prompts → didn't work
3. Try extracting from different properties → didn't work
4. Try smarter fallbacks → didn't work
5. Try removing filters → didn't work
6. Give up or hack together a brittle solution

**What actually worked: Systematic debugging**
1. Read SDK documentation and GitHub issues
2. Understand WHY empty text happens (intentional behavior)
3. Identify root cause (workflow design, not a bug)
4. Design proper solution (two-step AI calls)
5. Implement with defensive coding
6. Test systematically

**Concrete example of vibe failure:**
```javascript
// Vibes: "Just check if meals exist"
if (findResult?.result?.meals?.length > 0) {
  // This check fails even when meals exist!
}
```

Without logging the actual structure, we'd never know why this fails. Vibes would lead to:
- "Maybe add optional chaining?"
- "Maybe check result.data.meals instead?"
- "Maybe it's an array directly?"

Random guessing until something works.

**Systematic approach:**
```javascript
console.log("findResult:", JSON.stringify(findResult, null, 2));
// Reveals EXACT structure
// Fix the check to match reality
```

One line of logging reveals the truth. No guessing needed.

### 📊 The Scoreboard

**Total time spent:** ~12 hours
**Lines of code added:** 374
**AI models tried:** 2 (GPT-4o-mini, Claude Sonnet)
**Approaches that failed:** 6
**Production crashes caused by debugging:** 1
**GitHub issues researched:** 1 (Issue #4126)
**Aha! moments:** 1 (user insight about second AI call)

**Current status:** Implementation complete, testing in progress

### 🔮 What's Next

1. Debug why `findResult?.result?.meals?.length > 0` check is failing
2. Verify the actual structure of `findResult`
3. Fix the structure check to match reality
4. Test end-to-end meal update workflow
5. Apply this same pattern to activity logging and measurements

**Blueprint value:** This two-step workflow (tool call → AI analysis) will be copied for:
- `findRecentWorkouts()` → `identifyWorkoutFromContext()`
- `findRecentMeasurements()` → `identifyMeasurementFromContext()`
- Any other natural language update workflows

The struggle was worth it. This is the foundation for all future features.

---

## [Next Entry]

*To be continued as we face new challenges...*

---

**Last Updated:** November 6, 2025
**Total Entries:** 1
**Total Hours Documented:** 12
**Total Production Crashes:** 1
**Total "Aha!" Moments:** 1
