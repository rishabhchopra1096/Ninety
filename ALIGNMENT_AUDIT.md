# Ninety - PRD Alignment Audit

**Generated**: 2025-11-03
**Purpose**: Compare current implementation against PRD requirements

---

## Executive Summary

**Current Progress**: ~5% complete
**Critical Misalignments**: 7 major architectural issues
**What Works**: Chat UI, voice input, design system
**What's Broken**: Navigation structure, onboarding approach, activity concept, no data persistence

---

## ✅ WHAT'S ALIGNED WITH PRD

### 1. Technology Stack ✅
- **React Native with Expo** ✅
- **OpenAI GPT-4** ✅ (using gpt-4o-mini)
- **Vercel AI SDK** ✅
- **Firebase in dependencies** ✅ (not configured yet)
- **TypeScript** ✅
- **Railway for API** ✅

### 2. Chat Implementation ✅
**PRD Requirement**: "The chat screen is the heart of Ninety, where 80% of user interaction happens."

**Current Implementation**:
- Modern messaging UI (WhatsApp-style) ✅
- Message bubbles (user right, AI left) ✅
- Timestamp support ✅
- Typing indicators ✅
- Auto-scroll to bottom ✅
- Error handling ✅
- AI name "Ava" ✅

**File**: `src/screens/chat/ChatScreen.tsx` - Well implemented!

### 3. Voice Input ✅
**PRD Requirement**: "The message input area includes just three elements: a camera icon for photos, a microphone for voice input (speech-to-text), and the send button."

**Current Implementation**:
- Voice recording with visual feedback ✅
- Duration timer ✅
- OpenAI Whisper transcription ✅
- Recording overlay ✅

### 4. Design System ✅
**PRD Requirement**: Clean, modern design inspired by OpenAI ChatGPT

**Current Implementation**:
- Professional color palette ✅
- Typography scale ✅
- Spacing system ✅
- Border radius system ✅
- Shadow system ✅

**File**: `src/constants/theme.ts`

### 5. Image Capture UI ✅
**PRD Requirement**: Camera icon for photos

**Current Implementation**:
- Camera integration ✅
- Photo picker modal ✅
- UI implemented ✅
- ⚠️ Processing not implemented yet

---

## ❌ CRITICAL MISALIGNMENTS

### 1. ❌ WRONG: Navigation Structure

**PRD Requirement**:
> "The chat screen is the heart of Ninety, where 80% of user interaction happens."
> "This design choice reinforces that everything happens through natural conversation."
> "The interface is deliberately minimal"

**Current Implementation**:
```
❌ CURRENT (WRONG):
- Chat Tab
- Nutrition Tab (with 3 sub-tabs)
- Workout Tab
- Progress Tab
- Profile Tab

5 equal tabs - chat is just 1 of 5
```

**What PRD Actually Says**:
```
✅ CORRECT STRUCTURE:
Main Interface: CHAT (full screen, primary)

Bottom Navigation:
- Chat (home - always visible)
- Nutrition (view logged meals)
- Activity (view logged activities - NOT "Workout")
- Progress (measurements, photos)
- Profile (settings, journey)

All LOGGING happens through CHAT, not in tabs
Tabs are for VIEWING logged data only
```

**Impact**: **CRITICAL** - Violates core product philosophy

---

### 2. ❌ WRONG: Onboarding Approach

**PRD Requirement**:
> "When users first open Ninety, they see a brief welcome screen with the app logo and tagline 'Transform in 90 Days Through Conversation'. After a moment, this transitions directly to the chat interface where onboarding happens naturally through conversation."

**Current Implementation**:
```
❌ CURRENT (WRONG):
5 separate screens with forms:
- WelcomeScreen
- GoalsScreen
- ScheduleScreen
- PrepWeekPlanScreen
- AccountSetupScreen

Traditional app onboarding with UI forms
```

**What PRD Actually Says**:
```
✅ CORRECT APPROACH:
1. Brief welcome screen (logo + tagline)
2. Immediate transition to CHAT
3. AI asks questions conversationally
4. User responds in natural language
5. No forms, no navigation - just conversation

"There are no forms to fill out, no complex navigation
to learn - just a natural dialogue."
```

**Required Conversation Flow**:
1. Goal Discovery ("What brought you here today?")
2. Personal Information (height, weight, age, country)
3. Activity Assessment ("What can you realistically do?")
4. Meal Preference Discovery ("15 meals you regularly make")
5. Optional Features (cohort, phone calls, prep week)
6. Mythbuster Integration (educational moments)

**Impact**: **CRITICAL** - Wrong UX paradigm entirely

---

### 3. ❌ WRONG: "Workout" Tab Should Be "Activity" Tab

**PRD Requirement**:
> "The app recognizes that life circumstances change - someone might shift from gym workouts to hiking due to relocation, or switch from running to swimming due to injury. Ninety adapts seamlessly to these transitions, supporting any form of physical activity that moves users toward their goals."

**Current Implementation**:
```
❌ CURRENT (WRONG):
Tab Name: "Workout"
Screens:
- TodayWorkoutScreen
- WorkoutPlanScreen
- StrengthTrackerScreen

Gym-focused, strength training only
```

**What PRD Actually Says**:
```
✅ CORRECT APPROACH:
Tab Name: "Activity"
Single Screen: "Unified Activity Feed"

Supports ALL activities:
- Gym workouts
- Dance classes
- Basketball
- Walking
- Swimming
- Hiking
- ANY physical activity

"Whether someone went to the gym, attended a dance class,
played basketball, or simply walked, everything appears here
in a clean, chronological feed."
```

**Activity Card Examples** (from PRD):
- "Chest & Triceps Workout - 45 minutes - Bench Press PR: 185 lbs! 🎉"
- "Salsa Class - 60 minutes - 'Felt amazing!' - ~400 calories burned"
- "Evening Walk - 30 minutes - 4,823 steps - Perfect recovery day activity"

**Impact**: **CRITICAL** - Excludes most target users

---

### 4. ❌ WRONG: AI System Prompt

**Current System Prompt**:
```javascript
You are Ava, an expert AI fitness coach for the Ninety app -
a 90-day fitness transformation program based on science-backed
muscle building principles.

Key principles:
- Workouts: 3 times per week, 8-10 reps, 3-4 sets, 2.5lbs progressive increases
- Nutrition: Calculate calorie needs, emphasize protein
- Measurement: Weekly arm measurements to track muscle growth
- Sleep: 7 hours essential for muscle recovery
```

**Problems**:
- ❌ Gym-only focus (excludes dancers, runners, etc.)
- ❌ Prescriptive workout structure (doesn't adapt to user's reality)
- ❌ No onboarding conversation flow
- ❌ No meal logging capability
- ❌ No activity logging capability
- ❌ No context about the app's chat-first nature

**What PRD Actually Says**:
The AI should:
1. **Handle onboarding through conversation** (sequential questions)
2. **Parse ANY physical activity** ("went dancing", "played basketball", "hit 185 on bench")
3. **Log meals from natural language** ("just ate lunch", photo analysis)
4. **Adapt to user's reality** (gym access, home workouts, outdoor activities)
5. **Maintain long-term context** (preferences, history, patterns)
6. **Provide activity-agnostic coaching**

**Impact**: **CRITICAL** - AI doesn't serve core use cases

---

### 5. ❌ MISSING: Firebase Configuration

**PRD Requirement**:
> "Firebase provides the backend infrastructure including authentication, real-time database (Firestore), and media storage."

**Current State**:
- Firebase in package.json ✅
- Firebase NOT initialized ❌
- No authentication ❌
- No Firestore ❌
- No storage ❌
- All data lost on app restart ❌

**Required Setup**:
1. Create Firebase project
2. Add configuration file
3. Initialize Firebase in app
4. Set up Authentication (email/password, Google, Apple)
5. Configure Firestore with security rules
6. Set up Firebase Storage for images

**Impact**: **CRITICAL** - No data persistence blocks all features

---

### 6. ❌ WRONG: Chat Position in Navigation

**PRD Requirement**:
> "The chat screen is the heart of Ninety, where 80% of user interaction happens."

**Current Implementation**:
- Chat is tab #1 of 5 equal tabs
- User must navigate between tabs
- Chat doesn't feel like the primary interface

**What Should Happen**:
- Chat should feel like the HOME screen
- Other tabs are secondary views
- Most users should rarely leave chat
- Chat should be the default landing screen

**Impact**: **HIGH** - Dilutes chat-first philosophy

---

### 7. ❌ MISSING: Core Features from PRD

**Not Implemented**:
- ❌ User authentication (Firebase Auth)
- ❌ Onboarding conversation flow
- ❌ Meal logging through chat
- ❌ Activity logging through chat
- ❌ Photo analysis (food, progress, form check)
- ❌ Context summarization
- ❌ Long-term memory system
- ❌ Cohort system (optional ambient motivation)
- ❌ AI phone calls (Twilio)
- ❌ Progress photos with before/after slider
- ❌ Mythbuster questions
- ❌ Prep week (optional)
- ❌ Smart notifications
- ❌ Health app integration (steps, activity)
- ❌ Measurement tracking (bi-weekly)
- ❌ Analytics & pattern analysis
- ❌ "Things I Do Wrong" feature
- ❌ Grocery list generation
- ❌ Meal plan from user's 15 meals

**Impact**: **CRITICAL** - Missing 95% of features

---

## 🔄 WHAT NEEDS TO BE CHANGED

### Priority 1: Architectural Changes (Week 1)

#### 1.1 Redesign Navigation Structure
**File**: `src/navigation/MainTabNavigator.tsx`

**Change From**:
```typescript
5 equal tabs:
- Chat
- Nutrition (with 3 sub-tabs)
- Workout
- Progress
- Profile
```

**Change To**:
```typescript
5 tabs but different philosophy:
- Chat (PRIMARY - where everything happens)
- Nutrition (VIEW logged data)
- Activity (VIEW logged activities - RENAMED from "Workout")
- Progress (VIEW measurements/photos)
- Profile (VIEW journey, settings)
```

**Key Mindset Shift**:
- Chat is not "1 of 5" - it's the MAIN interface
- Other tabs are READ-ONLY views of data logged in chat
- No logging UI in tabs - all logging through chat

---

#### 1.2 Rebuild Onboarding as Chat Conversation
**Delete**:
- `src/screens/onboarding/WelcomeScreen.tsx`
- `src/screens/onboarding/GoalsScreen.tsx`
- `src/screens/onboarding/ScheduleScreen.tsx`
- `src/screens/onboarding/PrepWeekPlanScreen.tsx`
- `src/screens/onboarding/AccountSetupScreen.tsx`

**Replace With**:
- Brief splash screen (logo + tagline)
- Immediate transition to ChatScreen
- AI handles entire onboarding through conversation
- Backend tracks required fields
- Mark onboarding complete when all data collected

**Implementation**:
- Add `onboardingComplete: false` to user profile
- AI system prompt includes onboarding flow
- Backend validates required fields before marking complete
- Chat UI shows onboarding progress (subtle)

---

#### 1.3 Rename and Restructure "Activity" Tab
**Rename**:
- `src/screens/workout/` → `src/screens/activity/`
- `WorkoutStackParamList` → `ActivityStackParamList`

**Delete**:
- `TodayWorkoutScreen.tsx`
- `WorkoutPlanScreen.tsx`
- `StrengthTrackerScreen.tsx`

**Replace With**:
- Single screen: `ActivityFeedScreen.tsx`
- Unified feed of ALL activities (gym, dance, walking, sports)
- Activity cards adapt to activity type
- Strength tracking embedded in gym activity cards
- Health app integration (Apple Health/Google Fit)

---

#### 1.4 Rewrite AI System Prompt
**Current**: Gym-focused, prescriptive

**New Requirements**:
1. **Onboarding Phase**:
   - Ask sequential questions
   - Track required fields
   - Validate responses
   - Mythbuster questions
   - Mark onboarding complete

2. **Activity Logging Phase**:
   - Parse any physical activity description
   - Extract: type, duration, intensity, details
   - Store structured data from unstructured input
   - Support gym, dance, sports, walking, swimming, etc.

3. **Meal Logging Phase**:
   - Parse food descriptions
   - Analyze food photos
   - Extract: meal type, components, estimated calories
   - Build on user's 15 familiar meals

4. **Coaching Phase**:
   - Personalized advice based on user's activity type
   - Adapt to changing circumstances
   - Answer questions contextually
   - Maintain long-term memory

5. **Context Management**:
   - Summarize old conversations
   - Remember preferences
   - Track patterns
   - Surface insights

---

### Priority 2: Firebase Setup (Week 1)

#### 2.1 Initialize Firebase
**Create**: `src/config/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Add your config
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### 2.2 Set Up Authentication
- Email/password
- Google Sign-In
- Apple Sign-In
- Auth state management (Context)

#### 2.3 Design Firestore Schema
**Collections**:
```
users/{userId}
  - profile data
  - onboarding answers
  - settings
  - cohort info

conversations/{userId}/messages/{messageId}
  - chat history
  - timestamps
  - attachments

activities/{userId}/entries/{activityId}
  - activity logs from chat
  - type, duration, details

nutrition/{userId}/meals/{mealId}
  - meal logs from chat
  - photos, calories, components

measurements/{userId}/entries/{measurementId}
  - weight (daily)
  - body parts (bi-weekly)

progressPhotos/{userId}/photos/{photoId}
  - monthly photos
  - multiple angles

mealPlans/{userId}/plans/{planId}
  - AI-generated meal plans
  - based on user's 15 meals

groceryLists/{userId}/lists/{listId}
  - auto-generated from meal plan
```

---

### Priority 3: Core Features (Week 2-4)

#### 3.1 Chat Intelligence Layer
**Implement**:
- Message parsing (extract structured data)
- Photo analysis (food, progress, form)
- Context summarization
- Long-term memory system
- Multi-turn conversation tracking

**Files to Create**:
- `src/services/chatService.ts`
- `src/services/photoAnalysisService.ts`
- `src/services/memoryService.ts`

#### 3.2 Activity System
**Create**: `src/screens/activity/ActivityFeedScreen.tsx`

**Features**:
- Unified feed (all activity types)
- Activity cards (adapt to type)
- Health app integration
- Strength progression (embedded in gym cards)
- Consistency patterns

**Data Flow**:
1. User logs activity in chat ("went dancing for an hour")
2. AI extracts: type=dance, duration=60, intensity=medium
3. Stored in Firestore: `activities/{userId}/entries/{id}`
4. ActivityFeedScreen reads and displays

#### 3.3 Nutrition System
**Update Screens**:
- `FoodFeedScreen.tsx` - show logged meals from chat
- `MealPlanScreen.tsx` - AI-generated plan from 15 meals
- `GroceryListScreen.tsx` - auto-generated from meal plan

**Data Flow**:
1. User logs meal in chat ("had chicken and rice for lunch")
2. AI extracts: meal=lunch, components=[chicken, rice], calories=~450
3. Stored in Firestore: `nutrition/{userId}/meals/{id}`
4. FoodFeedScreen reads and displays

#### 3.4 Progress Tracking
**Implement**:
- Daily weight logging (through chat)
- Bi-weekly body measurements (AI reminder calls)
- Monthly progress photos (before/after slider)
- Analytics & pattern analysis
- "Things I Do Wrong" feature

---

### Priority 4: Accountability Features (Week 5-6)

#### 4.1 AI Phone Calls (Twilio)
**Features**:
- Daily check-in calls (optional, scheduled)
- 4-point checklist: activity, meals, weight, measurements
- Natural voice conversation
- SMS fallback if no answer
- Full chat context

#### 4.2 Cohort System (Optional)
**Features**:
- Opt-in during onboarding
- 5-day cohort formation
- Anonymous aggregate stats only
- Weekly challenges (consistency-based)
- Can disable anytime

#### 4.3 Smart Notifications
**Features**:
- Activity reminders (contextual)
- Meal logging prompts (if not consistent)
- Celebration notifications (PRs, streaks)
- Progress photo reminders (monthly)
- Measurement reminders (bi-weekly)

---

### Priority 5: Polish (Week 7-8)

#### 5.1 Onboarding Refinement
- Handle edge cases
- Unclear responses
- Users changing minds
- Skip validation
- Mythbuster timing

#### 5.2 Performance Optimization
- Image lazy loading
- Firebase query optimization
- Bundle size reduction
- Smooth animations
- Offline support

#### 5.3 Error Handling
- Offline queue
- Graceful degradation
- Retry logic
- Helpful error messages
- Loading/empty/error states

---

## 📊 Implementation Progress Estimate

### Current: ~5%
- ✅ Chat UI
- ✅ Voice input
- ✅ Design system
- ✅ Navigation structure (needs modification)
- ✅ API integration

### Required Work: ~95%
- ❌ Firebase setup (5%)
- ❌ Authentication (5%)
- ❌ Onboarding conversation (10%)
- ❌ AI system prompt rewrite (10%)
- ❌ Activity system (15%)
- ❌ Nutrition system (15%)
- ❌ Progress tracking (10%)
- ❌ Phone calls (10%)
- ❌ Cohort system (5%)
- ❌ Notifications (5%)
- ❌ Polish (5%)

---

## 🎯 Recommended Development Approach

### Phase 1: Foundation (Week 1)
**Goal**: Fix architectural issues, set up Firebase

1. Initialize Firebase
2. Set up authentication
3. Redesign navigation structure
4. Rewrite AI system prompt
5. Rebuild onboarding as chat conversation

**Deliverable**: Users can sign up, complete onboarding through chat, and data persists

---

### Phase 2: Core Features (Week 2-4)
**Goal**: Implement chat-driven logging and viewing

1. Activity logging through chat
2. Meal logging through chat
3. Photo analysis (food, progress)
4. Activity feed screen
5. Nutrition feed screen
6. Context summarization
7. Long-term memory

**Deliverable**: Users can log activities and meals through chat, view in feeds

---

### Phase 3: Accountability (Week 5-6)
**Goal**: Add motivation and tracking systems

1. Progress tracking (measurements, photos)
2. AI phone calls (Twilio)
3. Cohort system (optional)
4. Smart notifications
5. Health app integration
6. Analytics & insights

**Deliverable**: Full accountability system working

---

### Phase 4: Polish (Week 7-8)
**Goal**: Production-ready quality

1. Error handling
2. Offline support
3. Performance optimization
4. Edge case handling
5. User testing
6. Bug fixes

**Deliverable**: Production-ready app

---

## 📋 Key Takeaways

### What's Good:
1. ✅ Chat implementation is excellent quality
2. ✅ Tech stack is correct
3. ✅ Voice input works well
4. ✅ Design system is professional
5. ✅ Code structure is clean

### What's Wrong:
1. ❌ **Navigation philosophy violates PRD** - chat should dominate
2. ❌ **Onboarding approach is opposite of PRD** - should be conversational
3. ❌ **"Workout" concept is too narrow** - should be "Activity" for all movement
4. ❌ **AI prompt is gym-only** - should be activity-agnostic
5. ❌ **No Firebase setup** - blocking all data persistence
6. ❌ **95% of features missing** - but foundation is solid

### Next Steps:
1. **Week 1**: Fix architecture, set up Firebase
2. **Week 2-4**: Build chat-driven logging and viewing
3. **Week 5-6**: Add accountability features
4. **Week 7-8**: Polish to production quality

---

## 💡 Final Recommendation

**DO NOT** continue building on current structure. **STOP** and:

1. **Rebuild navigation** around chat-first philosophy
2. **Replace onboarding** with conversational flow
3. **Rename "Workout"** to "Activity" and make inclusive
4. **Rewrite AI prompt** to handle all use cases
5. **Set up Firebase** before adding more features

The chat screen is a great example of quality - use it as the reference for all other work. But the overall architecture needs realignment to PRD before continuing feature development.

---

**Current State**: Strong foundation, wrong direction
**Required Action**: Course correction, then rapid feature development
**Time to MVP**: 8 weeks from today (if following this plan)