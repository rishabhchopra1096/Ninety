# Ninety - Project State Document

**Last Updated:** 2025-11-04
**Phase:** Phase 1.5 Complete ✅ (Design System), Ready for Phase 2
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

*Core Components:*
- ✅ Button (primary, secondary, ghost variants)
- ✅ Card (flexible container with elevation)
- ✅ ProgressRing (animated circular progress)
- ✅ ProgressBar (animated linear progress)

*Content Components:*
- ✅ StatCard (metric display with progress ring)
- ✅ NutritionCard (meal/food display)
- ✅ ActivityCard (workout/activity display)

*Utility Components:*
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
import { Button, Card, ProgressRing, NutritionCard } from '@/components';
```

2. **Use theme values instead of hardcoded colors/spacing:**
```tsx
import { colors, spacing, typography } from '@/constants/theme';
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
import { Button, Card, ProgressRing } from '@/components';
import { colors, spacing } from '@/constants/theme';

export function TestScreen() {
  return (
    <View style={{ padding: spacing[5] }}>
      <Card elevation="md" padding="large">
        <ProgressRing size="large" progress={0.75} color={colors.secondary}>
          <Text style={{ fontSize: 24, fontWeight: '600' }}>75%</Text>
        </ProgressRing>

        <Button variant="primary" onPress={() => alert('Works!')}>
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
import { theme } from '../../constants/theme';
backgroundColor: theme.colors.background

// ✅ FIXED
import { colors, spacing, borderRadius } from '../../constants/theme';
backgroundColor: colors.background
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
   logActivity({ type, duration, intensity, notes })
   logMeal({ mealType, foods, calories, photoUrl })
   logMeasurement({ type, value, unit })
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
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

// ❌ WRONG
import { theme } from '../../constants/theme';
// (theme object doesn't exist!)
```

### Color Palette
```javascript
primary: '#10A37F'      // Teal green
secondary: '#1A73E8'    // Blue
success: '#58CC02'      // Bright green
error: '#FF4B4B'        // Red
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
- Indented sub-steps with "   ✅"

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

**End of Project State Document**
