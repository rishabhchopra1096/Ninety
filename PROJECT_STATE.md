# Ninety - Project State Document

**Last Updated:** 2025-11-06
**Phase:** Phase 2 In Progress - Meal Update Workflow Fixes
**Developer:** Rishabh Chopra

---

## 🎯 Project Vision

Ninety is a 90-day fitness transformation app with a **chat-first approach**. Unlike traditional fitness apps, ALL interactions happen through conversational AI (Ava). Users log workouts, meals, and progress by simply chatting - no forms, no complex UI.

**Key Principle:** "Everything happens through conversation"

See complete vision: `PRD.md` (383 lines)

---

## ✅ Phase 1: COMPLETE (Authentication & Persistence)

### What Works

**Authentication:**

- ✅ Email/password signup via Firebase Auth
- ✅ Email/password login
- ✅ Logout functionality
- ✅ Auth state persistence (AsyncStorage)
- ✅ Protected routes (auth screens vs main app)
- ✅ Multi-user support (separate data per user)

**Chat & Persistence:**

- ✅ Chat interface with Ava (AI coach)
- ✅ Message persistence to Firestore
- ✅ Chat history loads after logout/login
- ✅ Real-time AI responses via Railway API
- ✅ Welcome message only shows on first signup
- ✅ No duplicate messages on reload

**Voice Recording:**

- ✅ Microphone button in chat
- ✅ Voice recording with expo-audio v1.x
- ✅ Permission handling (iOS)
- ✅ Recording timer and UI overlay
- ✅ Transcription via OpenAI Whisper API
- ✅ Transcribed text sent to Ava

**Testing Results:**

```
Tested on: iOS Simulator
Test user: ninetyuser1@gmail.com
✅ Signup → Chat → Logout → Login → Messages persist (3 messages loaded)
✅ Multi-user test passed
✅ Voice recording works after fix
```

---

## ✅ Phase 1.5: COMPLETE (Design System Implementation)

### What Was Built

**Complete CalAI-Inspired Design System:**

- ✅ Analyzed 20+ CalAI screenshots and extracted all design elements
- ✅ Implemented black/white/orange color palette matching CalAI
- ✅ Created 11 production-ready components
- ✅ Built comprehensive theme system with all design tokens
- ✅ Documented everything in 3 guide files

**Component Library (11 Components):**

_Core Components:_

- ✅ Button (primary, secondary, ghost variants)
- ✅ Card (flexible container with elevation)
- ✅ ProgressRing (animated circular progress)
- ✅ ProgressBar (animated linear progress)

_Content Components:_

- ✅ StatCard (metric display with progress ring)
- ✅ NutritionCard (meal/food display)
- ✅ ActivityCard (workout/activity display)

_Utility Components:_

- ✅ Badge (status indicators, streak badges)
- ✅ IconButton (circular icon buttons + FAB)
- ✅ Avatar (user photos, initials, icons)
- ✅ EmptyState (empty list states)

**Theme System (`src/constants/theme.ts`):**

- ✅ CalAI color palette (black #000000, orange #FF6B00, white #FFFFFF)
- ✅ Extended neutral grays (50-900)
- ✅ Typography scale (display 72px to caption 12px)
- ✅ Spacing system (0-64px)
- ✅ Shadow/elevation levels (none, sm, md, lg, xl)
- ✅ Component sizes (buttons, avatars, progress rings, etc.)
- ✅ Animation timings and easing functions
- ✅ Accessibility constants (touch targets, contrast ratios)

**Documentation:**

- ✅ `/docs/CALAI_ANALYSIS.md` - Screenshot-by-screenshot design analysis
- ✅ `/docs/DESIGN_SYSTEM.md` - Complete design system reference
- ✅ `/docs/COMPONENT_GUIDE.md` - Component usage guide with examples
- ✅ `DESIGN_SYSTEM_SUMMARY.md` - Quick reference and implementation summary

### How to Use the Design System

**When building new features, ALWAYS:**

1. **Import components instead of building custom UI:**

```tsx
import {
  Button,
  Card,
  ProgressRing,
  NutritionCard,
} from "@/components";
```

2. **Use theme values instead of hardcoded colors/spacing:**

```tsx
import { colors, spacing, typography } from "@/constants/theme";
```

3. **Reference the component guide for examples:**

   - Check `/docs/COMPONENT_GUIDE.md` for props and usage
   - See complete dashboard example in the guide
   - Follow best practices section

4. **Quick reminder to Claude:**
   - Say: "Use the design system components from @/components"
   - Or: "Follow the COMPONENT_GUIDE.md"
   - Or: "Use CalAI visual design (black/white/orange)"

### Key Design Decisions

**Visual Design:**

- **Minimalism:** Clean black/white with orange accents (like CalAI)
- **Typography:** Large, bold headers (72px display for calorie numbers)
- **Components:** Card-based layouts with subtle shadows
- **Progress:** Circular rings for goals (protein, carbs, fats)

**Interaction Model (Hybrid):**

- **Chat-first:** Complex logging happens through conversation
- **Direct UI:** Quick actions like photo uploads, viewing data
- **Balance:** Visual richness without overwhelming

**Colors:**

```
Primary:    #000000 (Black)
Secondary:  #FF6B00 (Orange - accents, CTAs, streaks)
Background: #FFFFFF (White)
Grays:      #F8F9FA, #E5E7EB, #6B7280, etc.

Status:
  Success:  #10B981 (Green)
  Error:    #EF4444 (Red)

Macros:
  Protein:  #FF6B88 (Pink/Red)
  Carbs:    #FFA756 (Orange)
  Fats:     #6B9DFF (Blue)
```

### Testing the Design System

To verify components work:

```tsx
// Create a test screen
import { Button, Card, ProgressRing } from "@/components";
import { colors, spacing } from "@/constants/theme";

export function TestScreen() {
  return (
    <View style={{ padding: spacing[5] }}>
      <Card elevation="md" padding="large">
        <ProgressRing
          size="large"
          progress={0.75}
          color={colors.secondary}
        >
          <Text style={{ fontSize: 24, fontWeight: "600" }}>75%</Text>
        </ProgressRing>

        <Button variant="primary" onPress={() => alert("Works!")}>
          Test Button
        </Button>
      </Card>
    </View>
  );
}
```

### What's NOT Done Yet (Optional)

These are nice-to-haves, not blockers:

- ❌ ChatScreen colors not updated to CalAI style (still uses old green)
- ❌ Tab bar icons not added (needs icon library installed)
- ❌ Tab bar styling not updated to CalAI style

**Can proceed with Phase 2 without these!** New features will automatically use CalAI design.

---

## 📁 Architecture Overview

### Technology Stack

- **Frontend:** React Native 0.81.4 + Expo SDK 54
- **Language:** JavaScript (not TypeScript for screens)
- **Navigation:** React Navigation v7 (Stack + Bottom Tabs)
- **AI:** Vercel AI SDK + OpenAI GPT-4o-mini
- **Backend API:** Railway (https://ninety-production.up.railway.app)
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth
- **Storage:** Firebase Storage
- **State:** React hooks (no Redux/MobX)

### Key Files & Structure

```
Ninety/
├── src/
│   ├── components/ ✅ 11 COMPONENTS (CalAI design)
│   │   ├── Button.tsx ✅ Primary, secondary, ghost variants
│   │   ├── Card.tsx ✅ Flexible container with elevation
│   │   ├── ProgressRing.tsx ✅ Animated circular progress
│   │   ├── ProgressBar.tsx ✅ Animated linear progress
│   │   ├── StatCard.tsx ✅ Metric display with progress ring
│   │   ├── NutritionCard.tsx ✅ Meal/food display
│   │   ├── ActivityCard.tsx ✅ Workout/activity display
│   │   ├── Badge.tsx ✅ Status indicators, streak badges
│   │   ├── IconButton.tsx ✅ Circular icon buttons + FAB
│   │   ├── Avatar.tsx ✅ User photos, initials, icons
│   │   ├── EmptyState.tsx ✅ Empty list states
│   │   └── index.ts ✅ Component exports
│   ├── config/
│   │   └── firebase.js ✅ CONFIGURED
│   ├── contexts/
│   │   └── AuthContext.js ✅ IMPLEMENTED
│   ├── services/
│   │   └── chatService.js ✅ Firestore chat operations
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js ✅ WORKING
│   │   │   └── SignupScreen.js ✅ WORKING
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx ✅ WORKING (voice recording fixed)
│   │   ├── nutrition/ ❌ Placeholder only
│   │   ├── workout/ ❌ Placeholder only (needs rename to "activity")
│   │   ├── progress/ ❌ Placeholder only
│   │   └── profile/
│   │       └── ProfileMainScreen.tsx ✅ Logout button works
│   ├── navigation/
│   │   ├── AppNavigator.tsx ✅ Auth routing works
│   │   └── MainTabNavigator.tsx ✅ 5 tabs configured
│   ├── constants/
│   │   └── theme.ts ✅ COMPLETE CalAI design system
│   └── utils/
│       └── index.ts ✅ API URL generation
├── docs/ ✅ DESIGN SYSTEM DOCUMENTATION
│   ├── CALAI_ANALYSIS.md ✅ Screenshot analysis
│   ├── DESIGN_SYSTEM.md ✅ Complete design reference
│   └── COMPONENT_GUIDE.md ✅ Component usage guide
├── server/ ✅ Railway API deployed
├── App.tsx ✅ Firebase initialized
├── PRD.md ✅ Complete product spec
├── DESIGN_SYSTEM_SUMMARY.md ✅ Quick reference
├── ALIGNMENT_AUDIT.md ✅ Current vs PRD comparison
└── LOGGING_GUIDE.md ✅ Console log reference
```

---

## 🔥 Firebase Configuration

### Project Details

- **Project ID:** ninety-ed5a0
- **Region:** us-central1 (default)
- **Auth Provider:** Email/Password ✅ Enabled

### Firestore Structure (Current)

```
users/{userId}
  - email: string
  - createdAt: timestamp
  - onboardingComplete: boolean (false by default)

conversations/{userId}/messages/{messageId}
  - role: 'user' | 'assistant'
  - content: string
  - timestamp: timestamp
  - createdAt: timestamp
```

### Firebase JS SDK (Not Native)

- Using `firebase` package (v12.3.0)
- NOT using `react-native-firebase` (avoids dev client rebuilds)
- AsyncStorage for auth persistence

---

## 🚨 Critical Issues Fixed

### Issue 1: Theme Import Error ✅ FIXED

**Problem:** Auth screens importing `theme` object that doesn't exist

```javascript
// ❌ WRONG (old code)
import { theme } from "../../constants/theme";
backgroundColor: theme.colors.background;

// ✅ FIXED
import { colors, spacing, borderRadius } from "../../constants/theme";
backgroundColor: colors.background;
```

**Files Fixed:** LoginScreen.js, SignupScreen.js (lines 15 + all StyleSheet refs)

### Issue 2: Voice Recording API Change ✅ FIXED

**Problem:** expo-audio v1.x has different API than expo-av

```javascript
// ❌ OLD (expo-av)
import { Audio } from 'expo-audio';
await Audio.requestPermissionsAsync();
const { recording } = await Audio.Recording.createAsync(...);

// ✅ NEW (expo-audio v1.x)
import { useAudioRecorder, AudioModule } from 'expo-audio';
const audioRecorder = useAudioRecorder();
await AudioModule.requestRecordingPermissionsAsync();
await audioRecorder.record();
```

**File Fixed:** ChatScreen.tsx (lines 4, 31-32, 231-295)

### Issue 3: Railway API Sleep

**Status:** API working (200 responses in logs)
**URL:** https://ninety-production.up.railway.app/api/chat
**Endpoints:** `/api/chat`, `/api/transcribe`

---

## 📝 Strategic Console Logging

### Where Logs Are Added

**App Lifecycle:**

```javascript
App.tsx: "🚀 Ninety App Starting..."
firebase.js: "🔥 Initializing Firebase..." → "✅ Firebase initialized"
```

**Authentication Flow:**

```javascript
AuthContext.js:
  Signup: "📝 SIGNUP STARTED" → "✅ SIGNUP COMPLETE"
  Login: "🔓 LOGIN STARTED" → "✅ LOGIN COMPLETE"
  Logout: "🚪 LOGOUT STARTED" → "✅ LOGOUT COMPLETE"
  State: "✅ User authenticated: {email}"
```

**Navigation:**

```javascript
AppNavigator.tsx:
  "⏳ Checking authentication state..."
  "🔀 Navigation: Showing AUTH screens" or "MAIN APP"
```

**Chat & Data:**

```javascript
ChatScreen.tsx:
  "📚 Loading chat history for user: {uid}"
  "✅ Loaded X messages from Firestore"
  "📤 Sending message to API: {content}"
  "✅ Message saved to Firestore: {messageId}"
```

**Voice Recording:**

```javascript
ChatScreen.tsx:
  "🎙️ Requesting audio permission..."
  "✅ Permission granted, starting recording..."
  "✅ Recording started successfully"
  "🛑 Stopping recording..."
  "🎵 Recording saved to: {uri}"
```

See full logging guide: `LOGGING_GUIDE.md`

---

## ⚠️ Known Limitations (Not Bugs)

### Onboarding

- Currently just shows welcome message
- PRD requires conversational onboarding (Phase 2+)
- Sequential questions: goals, stats, activities, meals, optional features

### Activity Tracking

- Tab named "Workout" but should be "Activity" (per PRD)
- All activity screens are placeholders
- Need unified feed for ALL activities (gym, dance, walking, etc.)

### Nutrition & Progress

- All placeholder screens
- No meal logging, grocery lists, or meal plans yet
- No progress photos or measurement tracking yet

### AI Capabilities

- Basic chat works
- No function calling yet (logActivity, logMeal, etc.)
- No onboarding conversation flow
- No context summarization
- No long-term memory beyond message history

---

## 🎯 Phase 2: AI Health Coach Prompt (Next Steps)

### Goals

1. Write "mega prompt" for Ava that handles:

   - Onboarding questions (sequential, required fields)
   - Activity logging detection ("went for a run" → extract type, duration)
   - Meal logging detection ("had chicken for lunch" → extract meal, calories)
   - Health coaching (adaptive, not prescriptive)

2. Add function calling:

   ```javascript
   logActivity({ type, duration, intensity, notes });
   logMeal({ mealType, foods, calories, photoUrl });
   logMeasurement({ type, value, unit });
   ```

3. Implement onboarding state tracking
   - Track required fields in user profile
   - Don't allow normal chat until onboarding complete
   - Save responses to Firestore

### PRD Requirements for AI

**Chat-First Everything:**

- "I just finished chest day, hit 185 on bench" → Auto-log workout
- "Had chicken and rice for lunch" → Auto-log meal
- Photo upload → AI analyzes (food vs progress vs form check)

**Adaptive Coaching:**

- User says "gym": gym-specific advice
- User says "dance class": dance-specific advice
- Support ALL activities, not just gym

---

## 🧪 How to Test (Post-Compaction)

### Quick Verification Test

```bash
cd /Users/rishabhchopra/Documents/GitHub/ninety/Ninety
npm start
# Press 'i' for iOS Simulator
```

**Expected Logs:**

```
🚀 Ninety App Starting...
✅ Firebase initialized successfully
🔐 Setting up auth state listener...
🚫 No user authenticated - showing login screen
```

**Test Flow:**

1. Sign up with new email → Should navigate to chat
2. Send message "Test" → Should get AI response + save to Firestore
3. Log out → Should return to login
4. Log back in → Chat history should load (✅ Loaded X messages)

### Voice Recording Test

1. Tap microphone button
2. Should see permission request (if first time)
3. Recording overlay appears at top
4. Tap stop → Transcribes → Sends to Ava

---

## 🐛 Debugging Tips

### Firebase Connection Issues

```javascript
// Check Firebase is initialized
console logs should show: "✅ Firebase initialized successfully"

// If not, check:
- src/config/firebase.js imports correctly
- App.tsx has <AuthProvider> wrapper
```

### Auth Not Working

```javascript
// Check logs for:
"🔐 Setting up auth state listener..."
"✅ User authenticated: {email}"

// If missing, check:
- AuthContext is imported in App.tsx
- useAuth() is called in components
```

### Messages Not Persisting

```javascript
// Check logs for:
"✅ Message saved to Firestore: {messageId}"
"✅ Loaded X messages from Firestore"

// If missing:
- User must be authenticated (check Profile tab shows email)
- Firestore rules allow authenticated reads/writes
- Check Firebase Console → Firestore Database
```

### Voice Recording Fails

```javascript
// Check logs for:
"🎙️ Requesting audio permission..."
"✅ Permission granted"

// If fails:
- iOS Settings → Expo Go → Microphone: ON
- Using expo-audio v1.x API (useAudioRecorder)
- Not using old expo-av API
```

---

## 📦 Dependencies & Versions

### Key Packages

```json
{
  "expo": "~54.0.10",
  "react-native": "0.81.4",
  "firebase": "^12.3.0",
  "@react-native-async-storage/async-storage": "latest",
  "expo-audio": "^1.0.13",
  "@ai-sdk/openai": "^2.0.34",
  "@ai-sdk/react": "^2.0.51",
  "ai": "^5.0.51",
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/bottom-tabs": "^7.4.7",
  "@react-navigation/stack": "^7.4.8"
}
```

### Install Commands (if needed)

```bash
npm install @react-native-async-storage/async-storage
npm install react-native-pager-view
```

---

## 🔑 Environment Variables

### .env.local (Required)

```env
OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_API_BASE_URL=https://ninety-production.up.railway.app
```

### Firebase Config

Already hardcoded in `src/config/firebase.js`:

- Project: ninety-ed5a0
- API Key: AIzaSyCyawmM_wrUwvOKbOnJccmnAB_z6MX7_g0
- Auth Domain: ninety-ed5a0.firebaseapp.com

---

## 🎨 Design System

### Theme Location

`src/constants/theme.ts` - Exports individual constants (NOT a theme object)

### Import Pattern

```javascript
// ✅ CORRECT
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from "../../constants/theme";

// ❌ WRONG
import { theme } from "../../constants/theme";
// (theme object doesn't exist!)
```

### Color Palette

```javascript
primary: "#10A37F"; // Teal green
secondary: "#1A73E8"; // Blue
success: "#58CC02"; // Bright green
error: "#FF4B4B"; // Red
```

---

## 💡 Development Notes

### Code Style

- **Screens:** JavaScript (.js), not TypeScript
- **Utils/Config:** TypeScript (.ts)
- **Navigation:** TypeScript (.tsx)
- **No Redux/MobX:** Using React hooks only

### Logging Philosophy

- Strategic logs at decision points
- ✅/❌ prefixes for success/error
- 🔥🔐💬📱 emoji prefixes for categories
- Indented sub-steps with " ✅"

### Git Status

- **Not a git repo** (checked, no .git/config)
- Consider: `git init` before Phase 2

---

## 📚 Reference Documents

1. **PRD.md** - Complete product requirements (383 lines)
2. **ALIGNMENT_AUDIT.md** - Current state vs PRD comparison
3. **LOGGING_GUIDE.md** - Console logging reference
4. **PROJECT_STATE.md** - This file

---

## 🚀 Immediate Next Steps After Compaction

1. **Verify everything still works:**

   ```bash
   npm start
   # Test: signup → chat → logout → login
   ```

2. **Start Phase 2:**

   - Write AI mega prompt for Ava
   - Add onboarding conversation flow
   - Implement function calling (logActivity, logMeal)
   - Test with real scenarios

3. **PRD Alignment:**
   - Rename "Workout" tab → "Activity"
   - Build unified activity feed (all activity types)
   - Keep chat-first philosophy

---

## 📞 Context for Future Claude

**You are continuing work on Ninety**, a React Native fitness app with a chat-first approach.

**Current Status:** Phase 1 complete - authentication and message persistence work perfectly. Voice recording works. All core infrastructure is set up.

**What to do next:** Phase 2 - build the AI health coach prompt that handles onboarding and logging detection. See PRD.md for full requirements.

**Testing works!** User can signup, chat with Ava, logout, login, and messages persist. Logs confirm everything working (see LOGGING_GUIDE.md).

**Key constraint:** All interactions through chat - no forms, no complex UI. This is the core philosophy.

**Recent fixes applied:** Theme imports (colors instead of theme object), voice recording (expo-audio v1.x API). Don't redo these.

---

## 🍽️ Phase 2: Food Logging Implementation (IN PROGRESS)

### Status: Core Infrastructure Complete, Fixing Tool Result Extraction Bug

**Last Updated:** 2025-11-05

### What Works ✅

**Tool Calling Infrastructure:**

- ✅ Vercel AI SDK v5 with `generateText()` and `maxSteps: 10`
- ✅ Multi-step tool execution with automatic tool calling
- ✅ Message extraction from `result.response.messages` (handles empty text after tools)
- ✅ Context-aware fallback messages based on tool type

**Implemented Tools:**

1. ✅ `logMeal` - Logs meals to Firestore after user confirmation
2. ✅ `findRecentMeals` - Searches recent meals (by food name, limit)
3. ✅ `updateMeal` - Updates existing meals (foods, notes, mealType)
4. ✅ `getDailySummary` - Retrieves daily nutrition totals

**Basic Food Logging:**

- ✅ User says "I had 2 eggs for breakfast" → AI extracts nutrition → asks confirmation → logs to Firestore
- ✅ Firestore structure: `nutrition/{userId}/meals/{mealId}` with foods array, totalCalories, mealType, timestamp
- ✅ Meals persist across sessions

**System Prompt Enhancements:**

- ✅ Sequential workflow enforced (findRecentMeals → describe → confirm → updateMeal)
- ✅ Explicit instructions to ALWAYS respond after calling tools
- ✅ Concrete examples of meal update workflows

### Current Blocking Issue 🚨

**Bug:** Tool results extraction from wrong location in server.js:703-704

**Symptoms:**

- Backend logs: `✅ Found 1 recent meals from Firestore`
- Frontend receives: `I couldn't find any recent meals matching your request`
- Fallback message logic fails because `toolResults` array is empty

**Root Cause:**
Lines 703-704 extract from properties that don't exist at top level in AI SDK v5:

```javascript
// CURRENT (BROKEN):
const toolCalls = result.toolCalls || [];
const toolResults = result.toolResults || [];
```

In Vercel AI SDK v5, these exist in `result.steps[]`:

```javascript
result.steps = [
  { toolCalls: [...], toolResults: [...] },
  { toolCalls: [...], toolResults: [...] }
]
```

**Verified Fix:**

```javascript
// CORRECT:
const toolCalls =
  result.steps?.flatMap((step) => step.toolCalls || []) || [];
const toolResults =
  result.steps?.flatMap((step) => step.toolResults || []) || [];
```

**Evidence This Is Correct:**

- Line 744 already uses this pattern successfully: `result.steps?.filter(step => step.toolCalls).flatMap(step => step.toolCalls)`
- Agent verification confirmed AI SDK v5 structure
- Backend logs prove data exists in the execution steps

### Bugs Fixed During Development ✅

1. **Empty message after tool calls** - Implemented extraction from `result.response.messages` with proper array content handling (lines 644-672)
2. **Generic fallback messages** - Made fallback context-aware: different messages for logMeal vs updateMeal vs findRecentMeals (lines 703-737)
3. **Silent mealType parameter failure** - Added `mealType` to updateMeal schema (line 432)
4. **AI hallucinations** - Replaced `stopWhen: stepCountIs(5)` with `maxSteps: 10` (cumulative counting issue)
5. **Firestore index errors** - Removed `.where()` when using `.orderBy()` in findRecentMeals

### Testing Scenarios

**Working Scenarios:**

- ✅ "I had 2 sunny side eggs for breakfast" → AI estimates nutrition → confirms → logs
- ✅ "I had chicken and rice for lunch" → AI asks portion sizes → estimates calories → logs

**Currently Broken (Will Fix After Bug Fix):**

- ❌ "Actually that was lunch not breakfast" → Should find meal → describe it → confirm → update
  - Currently says "couldn't find" even when meal exists

**Next Tests After Fix:**

- Update meal type: "That was lunch not breakfast"
- Update meal contents: "Actually I had 3 eggs not 2"
- Update with notes: "Add a note that it had hot sauce"

### Key Implementation Details

**Message Extraction Logic (server.js:644-672):**

```javascript
// Try simple case first
let message = result.text || "";

// If no text, extract from all assistant messages
if (!message || !message.trim()) {
  message = result.response.messages
    .filter((msg) => msg.role === "assistant")
    .map((msg) => {
      // Handle string content
      if (typeof msg.content === "string") return msg.content;
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
```

**Context-Aware Fallback (server.js:703-737):**

```javascript
if (!message || !message.trim()) {
  // Extract toolCalls and toolResults (BUG: wrong location!)
  const toolCalls = result.toolCalls || []; // ← FIX THIS
  const toolResults = result.toolResults || []; // ← FIX THIS

  if (toolCalls.some((tc) => tc.toolName === "logMeal")) {
    message = "✅ Your meal has been logged!";
  } else if (toolCalls.some((tc) => tc.toolName === "updateMeal")) {
    message = "✅ Your meal has been updated!";
  } else if (
    toolCalls.some((tc) => tc.toolName === "findRecentMeals")
  ) {
    // Provide detailed fallback with meal details
    const findResult = toolResults.find(
      (tr) => tr.toolName === "findRecentMeals"
    );
    if (findResult?.result?.meals?.length > 0) {
      const meal = findResult.result.meals[0];
      message = `I found your ${meal.mealType} from ${timeStr}...`;
    } else {
      message = "I couldn't find any recent meals...";
    }
  }
}
```

**System Prompt Sequential Workflow (server.js:159-227):**

```javascript
**CRITICAL: After calling findRecentMeals, you MUST:**
1. Describe what meals you found (meal type, time, foods, calories)
2. Identify which specific meal the user is referring to
3. Explain what change you'll make
4. Ask for explicit confirmation: "Should I make this change?"
5. DO NOT proceed to updateMeal until user confirms in their next message

### CONCRETE WORKFLOW EXAMPLES:

**Example 1 - Changing meal type:**
User: "Actually that was lunch not breakfast"
You: *Call findRecentMeals({ limit: 10 })*
You: "I found your breakfast from 9:00 AM with 2 sunny side eggs (140 cal). I'll change this to be logged as lunch instead. Should I make this update?"
User: "Yes"
You: *Call updateMeal({ mealId: "abc123", mealType: "lunch" })*
You: "✅ Updated! Your meal is now logged as lunch."
```

### Firestore Structure

```
nutrition/{userId}/meals/{mealId}
  - mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  - foods: [
      {
        name: string,
        quantity: string,
        calories: number,
        protein: number,
        carbs: number,
        fats: number,
        fiber: number
      }
    ]
  - totalCalories: number
  - notes: string (optional)
  - timestamp: timestamp
```

### Update: November 5, 2025 - Critical Issues Discovered

After extensive debugging and user testing, we discovered that meal updates STILL don't work despite all previous fixes. Through systematic investigation, we identified the root causes:

#### ✅ Fixes Applied (Previous Session)

1. **Lines 703-704: toolResults extraction** - Changed from `result.toolCalls` to `result.steps?.flatMap(step => step.toolCalls || [])`
2. **Line 444: Firestore query** - Changed from `orderBy('timestamp')` to `orderBy('createdAt')` to avoid indexing issues
3. **Lines 490-506: ID validation** - Added rejection of placeholder IDs like "xyz789"
4. **Lines 727-763: Fallback success checking** - Added checks for `toolResults[].result.success`
5. **System prompt enhancements** - Added calculation rules, realistic example IDs, stronger warnings

#### 🚨 NEW CRITICAL ISSUES DISCOVERED (Current Session)

**Evidence from Production Logs:**

```
🔧 Executing findRecentMeals tool
✅ Found 2 recent meals from Firestore
⚠️ AI called tools but generated no text. Providing fallback based on tool type.
🤖 Generated response: I couldn't find any recent meals matching your request...
```

**Analysis:** findRecentMeals IS working and finding meals, but the system is saying it can't find them!

#### Problem 1: AI Not Analyzing Tool Results ⚠️ CRITICAL

**What's Happening:**

- User says: "Actually that was lunch not breakfast"
- AI calls `findRecentMeals` → Returns 2 meals ✅
- AI generates NO TEXT after calling the tool ❌
- Fallback logic kicks in and says "couldn't find meals" ❌

**Root Cause:**
The AI is not reading the tool results and generating a response. The Vercel AI SDK's `generateText()` function:

1. Calls the tool
2. Gets results back
3. Should have AI analyze results and respond
4. But AI generates empty text instead
5. Fallback tries to compensate but fails

**Expected vs Actual Workflow:**

Expected:

```
1. AI calls findRecentMeals
2. Tool returns: {meals: [{id: "abc123", mealType: "breakfast", ...}, ...]}
3. AI READS results
4. AI generates: "I found your breakfast from 9:00 AM with eggs (180 cal)..."
5. AI asks for confirmation
6. User confirms
7. AI calls updateMeal with real ID
```

Actual:

```
1. AI calls findRecentMeals
2. Tool returns: {meals: [{id: "abc123", ...}, ...]}
3. AI generates EMPTY TEXT
4. Fallback says "couldn't find any meals" (wrong!)
5. Workflow fails
```

**User's Key Insight:**
The system is trying to use code logic (containsFood filter, fallback messages) to figure out which meal to update, when it should be using a SECOND AI ANALYSIS STEP:

```
Step 1: findRecentMeals returns all recent meals
Step 2: Make ANOTHER AI call asking: "Which of these meals is the user referring to?"
Step 3: AI analyzes conversation context + meal data
Step 4: AI identifies the specific meal and its ID
Step 5: AI confirms with user showing full macros
Step 6: AI calls updateMeal with the correct ID
```

#### Problem 2: Fallback Logic Structure Mismatch

**Location:** Lines 741-754

```javascript
const findResult = toolResults.find(
  (tr) => tr.toolName === "findRecentMeals"
);
if (findResult?.result?.meals?.length > 0) {
  // Show meal details
} else {
  message = "I couldn't find any recent meals..."; // ❌ This is triggering wrongly
}
```

**Issue:** We're checking `findResult?.result?.meals` but the actual structure of `toolResults` might be different. The tool returns `{meals: [...]}` but we may be accessing it incorrectly.

**Need:** Add debug logging to see actual structure:

```javascript
console.log(
  "🔍 DEBUG toolResults:",
  JSON.stringify(toolResults, null, 2)
);
console.log(
  "🔍 DEBUG findResult:",
  JSON.stringify(findResult, null, 2)
);
```

#### Problem 3: Mock Database in Production Code ⚠️ CRITICAL

**Locations:**

- Lines 429-440 (findRecentMeals)
- Lines 365-384 (logMeal)
- Lines 510-528 (updateMeal)
- Lines 590-620 (getDailySummary)

**The Pattern:**

```javascript
if (!db) {
  console.warn("⚠️  Firestore not available, using mock database");
  // Returns fake data instead of failing
}
```

**Why This Is Dangerous:**

- If Firestore goes down, app silently uses fake data
- User thinks meals are saved but they're not
- Creates inconsistent state between what AI thinks happened and reality
- Should FAIL LOUDLY in production, not use mock data

**Fix Required:** Remove all mock database logic. Production should throw clear errors if Firestore is unavailable.

#### Problem 4: Premature Code-Based Filtering

**Location:** Lines 453-458

```javascript
if (containsFood) {
  const hasFood = data.foods?.some((f) =>
    f.name.toLowerCase().includes(containsFood.toLowerCase())
  );
  if (!hasFood) return;
}
```

**Issue:** Trying to be "smart" with code-based string matching instead of letting AI use its intelligence.

**Better Approach:** Return all recent meals and let AI analyze conversation context to determine which meal the user is referring to.

---

### Current Status: BLOCKED

**Meal Update Workflow:** NOT WORKING

- Basic meal logging works ✅
- Finding recent meals works ✅
- But AI doesn't analyze which meal to update ❌
- Fallback shows wrong messages ❌

---

## 🔧 Phase 2.5: Meal Update Workflow Debugging & Fixes (November 5-6, 2025)

### Critical Discovery: Root Cause of Empty Text Bug

After extensive debugging, testing, and research, we identified the **REAL** problem with meal updates:

**The Issue:**
When AI calls `findRecentMeals`, it successfully finds meals BUT generates **EMPTY TEXT** after the tool call. This happens with BOTH OpenAI GPT-4o-mini AND Claude Sonnet 4.5.

**Evidence:**
```
✅ Found 2 recent meals from Firestore
✅ AI request successful
📊 result.text: EMPTY
⚠️ AI called tools but generated no text
```

**Research Findings:**
- Investigated Vercel AI SDK GitHub Issue #4126
- OpenAI and Google models return `content: null` after tool calls
- Anthropic (Claude) is designed to include text BUT still produces empty text in our case
- This is NOT a model problem - it's a **workflow design problem**

### 6 Phases Completed ✅

#### **Phase 1: Debug Logging** ✅ COMPLETED (then removed)
- Added extensive debug logging to understand SDK behavior
- Logged `result.text`, `result.steps`, `toolCalls`, `toolResults`
- Discovered the empty text issue
- **Later removed** due to production crashes (see Phase 1 Fix below)

#### **Phase 2: Remove Mock Database** ✅ COMPLETED
**Locations:** Lines 750-757, 906-913, 1134-1141, 1256-1266

Changed from silent fallback to explicit errors:
```javascript
// BEFORE:
if (!db) {
  console.warn('⚠️  Firestore not available, using mock database');
  return mockData; // DANGEROUS - creates inconsistent state!
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

**Why This Matters:** Production code should FAIL LOUDLY if database unavailable. Silent fallbacks to fake data create inconsistent state between what AI thinks happened and reality.

#### **Phase 3: Simplify findRecentMeals** ✅ COMPLETED
**Location:** Lines 883-937

Removed `containsFood` parameter and client-side filtering:
```javascript
// BEFORE:
inputSchema: z.object({
  containsFood: z.string().optional(), // ❌ Premature filtering
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
  // Return ALL meals unfiltered - let AI analyze context
  meals.push({
    id: doc.id,
    mealType: data.mealType,
    foods: data.foods,
    // ... all fields
  });
}
```

**Why This Matters:** Code-based string matching (`containsFood.includes()`) can't understand context like "that was lunch" or "the eggs I had". AI needs full meal data to analyze conversation context.

#### **Phase 4: Redesign updateMeal to be AI-Driven** ✅ COMPLETED
**Location:** Lines 985-1290

Complete tool redesign - accepts natural language `updateRequest` instead of rigid structured parameters:

```javascript
// BEFORE (rigid parameters):
inputSchema: z.object({
  mealId: z.string(),
  foods: z.array(...).optional(),
  totalCalories: z.number().optional(),
  mealType: z.string().optional(),
  notes: z.string().optional(),
})

// AFTER (flexible AI-driven):
analyzeAndUpdateMeal: tool({
  description: "Update an existing meal using AI analysis of the change request",
  inputSchema: z.object({
    mealId: z.string(),
    updateRequest: z.string(), // ← Natural language like "I only had half" or "add a Coke"
  }),
  execute: async ({ mealId, updateRequest }) => {
    // STEP 1: Fetch existing meal from Firestore
    const existingMeal = await mealRef.get().data();

    // STEP 2: Make nested AI call to analyze the update
    const analysisPrompt = `You are a nutrition analysis assistant...
EXISTING MEAL:
${JSON.stringify(existingMeal, null, 2)}

USER UPDATE REQUEST:
"${updateRequest}"

INSTRUCTIONS:
1. Analyze what the user wants to change
2. Generate a COMPLETE new meal object with ALL fields
3. If foods changed: recalculate totals (sum all food macros)
4. If "half": divide quantities AND macros by 2
5. If "add food": add to array AND add that food's macros to totals
...`;

    const analysisResult = await generateText({
      model: anthropic("claude-sonnet-4-5"),
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.3,
    });

    // STEP 3: Parse JSON response
    const jsonText = analysisResult.text.match(/```json\n([\s\S]*?)\n```/)[1];
    let newMeal = JSON.parse(jsonText);

    // STEP 4: Update in Firestore
    await mealRef.update({
      mealType: newMeal.mealType,
      foods: newMeal.foods,
      totalCalories: newMeal.totalCalories || 0,
      totalProtein: newMeal.totalProtein || 0,
      // ... all fields
    });

    return {
      success: true,
      changesSummary: newMeal.changesSummary,
      updatedMeal: { id: mealId, mealType: newMeal.mealType, ... }
    };
  }
})
```

**Why This Matters:** Users say things like:
- "I only had half"
- "Add a Coke to that"
- "Actually no cheese"
- "That was lunch not breakfast"

AI can understand these naturally - code can't.

#### **Phase 1 Fix: Remove Crashing Debug Logging** ✅ COMPLETED
**Error:** `TypeError: Cannot read properties of undefined (reading 'substring')` at line 1662

**Root cause:** Debug logging tried to call `.substring()` on undefined:
```javascript
console.log(`Args: ${JSON.stringify(tc.args).substring(0, 100)}...`); // ❌ Crashes if tc.args is undefined
```

**Fix:** Removed extensive debug logging (lines 1650-1706), kept only safe logging:
```javascript
console.log("📊 result.text:", result.text ? "present" : "EMPTY");
console.log("📊 result.steps count:", result.steps?.length || 0);
```

#### **Phase 6: Switch to Claude Sonnet 4.5** ✅ COMPLETED
**Locations:** Lines 36, 1197, 1611

Initially thought empty text was a GPT-4o-mini limitation. Migrated to Claude Sonnet 4.5:

```javascript
// Line 36 - Import change:
const { anthropic } = require("@ai-sdk/anthropic"); // was: @ai-sdk/openai

// Line 1611 - Main chat model:
model: anthropic("claude-sonnet-4-5"), // was: openai("gpt-4o-mini")

// Line 1197 - Nested AI call in analyzeAndUpdateMeal:
model: anthropic("claude-sonnet-4-5"),
```

**Deployment fixes:**
- Added `"@ai-sdk/anthropic": "^2.0.41"` to `server/package.json`
- Added `ANTHROPIC_API_KEY` to Railway environment variables
- Fixed MODULE_NOT_FOUND error (Railway uses server's package.json, not root)

**Result:** Same empty text issue persists - confirmed this is NOT a model problem.

**Cost Impact:**
- GPT-4o-mini: $0.60/mo for current usage
- Claude Sonnet 4.5: $13/mo for current usage
- Worth it for better conversational quality in tool-heavy apps

### Understanding the Real Problem

**What We Thought:**
"GPT-4o-mini doesn't generate text after tool calls. Claude will fix this."

**What's Actually Happening:**
The workflow design is fundamentally wrong. We're expecting ONE AI call to:
1. Call findRecentMeals
2. Receive meal data back
3. Analyze which meal user is referring to
4. Generate response describing the meal
5. Ask for confirmation

This is too much for a single AI generation step!

**The User's Key Insight:**
> "Once we query the recent meals, shouldn't it undergo a second round of AI evaluation to figure out which meal we're talking about?"

**Correct Workflow (Phase 7 - TO IMPLEMENT):**
```
User: "Actually that was lunch not breakfast"

Step 1: AI calls findRecentMeals(limit: 10)
  → Returns: [{id: "abc123", mealType: "breakfast", foods: [...], ...}, ...]

Step 2: SECOND AI CALL - identifyMealFromContext()
  → Input: meals array + conversation history + user's update intent
  → AI analyzes: "User said 'that was lunch' - they're referring to the most recent meal"
  → Returns: { mealId: "abc123", mealType: "breakfast", reasoning: "..." }

Step 3: Generate response to user
  → "I found your breakfast from 9:00 AM with 2 sunny side eggs (140 cal, 12g protein, 10g fat, 0g carbs). I'll change this to be logged as lunch instead. Should I make this update?"

Step 4: Wait for user confirmation
  → User: "Yes"

Step 5: AI calls analyzeAndUpdateMeal(mealId: "abc123", updateRequest: "change to lunch")
  → Updates Firestore
  → Returns: "✅ Updated! Your meal is now logged as lunch."
```

### Why This Matters

**Current broken flow:**
```
findRecentMeals → (empty text) → fallback message "couldn't find meals"
```

**Fixed flow:**
```
findRecentMeals → identifyMealFromContext → describe meal → confirm → analyzeAndUpdateMeal
```

This separates concerns:
- Tool calling (fetch data)
- AI analysis (which meal?)
- User communication (describe + confirm)
- Tool calling (update data)

### Research Links

**Vercel AI SDK GitHub Issue #4126:**
Discussion about empty text after tool calls. Confirmed that:
- OpenAI/Google return `content: null` after tools
- Anthropic includes text by design
- Workarounds involve extracting from `result.response.messages`

### Next Steps (Phase 7 - TO IMPLEMENT):

1. **Implement second AI analysis step** (Priority 1)

   - Create `identifyMealFromContext()` helper function
   - Takes: meals array + conversation history + user's update intent
   - Makes AI call to identify which specific meal
   - Returns: `{ mealId, mealType, reasoning }`
   - Integrate into main chat flow after findRecentMeals

2. **Test all update scenarios** (Phase 8)

   - "Actually that was lunch not breakfast"
   - "I only had 1 egg not 2"
   - "I also had toast"
   - "I only ate half"
   - "Add a note: it had hot sauce"

3. **Update documentation** (Final phase)
   - SERVER_CODE_EXPLANATION.md
   - PROJECT_STATE.md (final update)
   - Document new two-step architecture

---

### Lessons Learned (Updated)

1. **AI SDK v5 Structure:** Always extract from `result.steps[]`, not top-level properties
2. **Empty Text After Tools:** AI often generates no text when calling tools - this is the CORE issue blocking meal updates
3. **Context-Aware Fallbacks:** Even with correct fallback logic, can't replace actual AI analysis
4. **Code Logic vs AI Intelligence:** Don't try to be smart with code (containsFood filter) - let AI analyze context
5. **Mock Data Is Dangerous:** Silent fallbacks to fake data create inconsistent state - fail loudly instead
6. **Second Analysis Step:** Complex workflows (identifying which meal to update) need multiple AI calls with different contexts
7. **Thorough Investigation:** Backend logs are critical - they revealed findRecentMeals WAS working when we thought it wasn't
8. **User Testing Is Key:** Logs showed the actual problem vs what we assumed was happening

---

### Files Modified

- `server/server.js` - Tool implementations, AI configuration, message extraction, validation (lines 64-792)
- `PROJECT_STATE.md` - This documentation
- `docs/SERVER_CODE_EXPLANATION.md` - Created detailed explanation of server.js (NEW)

---

### Railway Deployment

**API URL:** https://ninety-production.up.railway.app
**Endpoints:**

- `/api/chat` - Main AI chat with tool calling
- `/api/transcribe` - Voice transcription via Whisper

**Status:** Deployed but meal update workflow not functional

---

**End of Project State Document**
