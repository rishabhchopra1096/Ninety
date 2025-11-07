# Activity Session Grouping - Testing Script

## Test Scenario 1: Basic Session Grouping (HAPPY PATH)

### Turn 1: Log First Exercise

**User Prompt:**

```
I did bench press, 3 sets of 8 at 30 kg
```

**Expected AI Response:**

```
Awesome! Bench Press 3x8 @ 30 kg. Should I log this?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged! [Session name] (10 min, ~50 calories burned). 💪
```

_(Note: AI may generate empty text - fallback will say "✅ Done!" which is the known bug)_

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId1}`

```json
{
  "type": "strength_training",
  "name": "Chest Workout" (or similar),
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 8,
      "weight": 30,
      "unit": "kg",
      "isPR": false (or true if it's a PR)
    }
  ],
  "totalVolume": 720,  // 3 × 8 × 30 = 720
  "duration": 10,
  "caloriesBurned": 50,  // 10 min × 5 cal/min = 50
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Only 1 session document created
- ✅ Has `duration: 10`
- ✅ Has `caloriesBurned: 50`
- ✅ `totalVolume: 720`
- ✅ `exercises` array has 1 item

---

### Turn 2: Add Second Exercise to Same Session

**User Prompt:**

```
Now I did bicep curls, 3 sets of 8 at 10 kg
```

**Expected AI Response:**

```
Would you like to add Bicep Curls to your current [Chest Workout] session?
```

_(AI should call findRecentActivities, see the recent session, and ask)_

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Added Bicep Curls to your workout! [Session name] now has 2 exercises (20 min, ~100 calories). Total volume: [updated volume]. 💪
```

_(Note: May get empty text bug - fallback: "✅ Done!")_

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId1}` (SAME ID as Turn 1)

```json
{
  "type": "strength_training",
  "name": "Chest & Arms Workout" (AI should update name),
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 8,
      "weight": 30,
      "unit": "kg",
      "isPR": false
    },
    {
      "name": "Bicep Curls",
      "sets": 3,
      "reps": 8,
      "weight": 10,
      "unit": "kg",
      "isPR": false
    }
  ],
  "totalVolume": 960,  // (3×8×30) + (3×8×10) = 720 + 240 = 960
  "duration": 20,      // Updated: 2 exercises × 10 min
  "caloriesBurned": 100,  // Updated: 20 min × 5 cal/min = 100
  "timestamp": "2025-11-07T..." (updated to latest exercise time),
  "createdAt": "2025-11-07T..." (original creation time),
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Still only 1 session document (NOT 2!)
- ✅ Session has 2 exercises
- ✅ `duration` updated to 20
- ✅ `caloriesBurned` updated to 100
- ✅ `totalVolume` updated to 960
- ✅ Session `name` updated (e.g., "Chest & Arms Workout")
- ✅ `timestamp` updated to recent time

---

## Test Scenario 2: User Declines Session Grouping

### Turn 3: Log Different Exercise (User Wants Separate Session)

**User Prompt:**

```
I did squats, 3 sets of 10 at 60 kg
```

**Expected AI Response:**

```
Would you like to add Squats to your current [Chest & Arms Workout]?
```

_(AI finds the recent session from Turn 2)_

**User Prompt:**

```
No, that's a separate workout
```

**Expected AI Response:**

```
Got it! Squats 3x10 @ 60 kg. Should I log this as a new leg workout?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged! Leg Workout (10 min, ~50 calories). 💪
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId2}` (NEW ID, different from sessionId1)

```json
{
  "type": "strength_training",
  "name": "Leg Workout",
  "exercises": [
    {
      "name": "Squats",
      "sets": 3,
      "reps": 10,
      "weight": 60,
      "unit": "kg",
      "isPR": false
    }
  ],
  "totalVolume": 1800, // 3 × 10 × 60 = 1800
  "duration": 10,
  "caloriesBurned": 50,
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ NOW there are 2 total session documents
- ✅ First session (Chest & Arms) unchanged
- ✅ Second session (Leg Workout) has 1 exercise
- ✅ Both sessions have proper calories

---

## Test Scenario 3: Cardio Activity (No Session Grouping)

### Turn 4: Log Cardio Activity

**User Prompt:**

```
I went for a 3-mile run
```

**Expected AI Response:**

```
Great! How long did you run for?
```

**User Prompt:**

```
About 30 minutes
```

**Expected AI Response:**

```
Nice run! 30 minutes, 3 miles - moderate pace. Based on your weight (160 lbs), I estimate approximately 300 calories burned. Should I log this?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged your morning run! Keep up the great work! 🏃
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId3}` (NEW ID)

```json
{
  "type": "cardio",
  "name": "Running",
  "duration": 30,
  "distance": 3,
  "distanceUnit": "miles",
  "intensity": "moderate",
  "caloriesBurned": 300, // AI calculated based on user weight
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Cardio activity does NOT trigger session grouping
- ✅ Has `caloriesBurned: 300`
- ✅ Has `distance` and `distanceUnit`
- ✅ NO `exercises` array (cardio doesn't use that)

---

## Test Scenario 4: Multiple Exercises Logged Together

### Turn 5: Log Multiple Exercises in One Message

**User Prompt:**

```
I did deadlifts 3x5 at 100 kg, then bent-over rows 3x8 at 40 kg
```

**Expected AI Response:**

```
Nice back workout! Let me break that down:
• Deadlifts: 3x5 @ 100 kg
• Bent-Over Rows: 3x8 @ 40 kg
Total volume: [calculated]. Should I log this session?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged your back workout! Crushing it! 💪
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId4}` (NEW ID)

```json
{
  "type": "strength_training",
  "name": "Back Workout",
  "exercises": [
    {
      "name": "Deadlifts",
      "sets": 3,
      "reps": 5,
      "weight": 100,
      "unit": "kg",
      "isPR": false
    },
    {
      "name": "Bent-Over Rows",
      "sets": 3,
      "reps": 8,
      "weight": 40,
      "unit": "kg",
      "isPR": false
    }
  ],
  "totalVolume": 2460, // (3×5×100) + (3×8×40) = 1500 + 960 = 2460
  "duration": 20, // 2 exercises × 10 min = 20
  "caloriesBurned": 100, // 20 min × 5 cal/min = 100
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Both exercises logged in ONE session
- ✅ `duration: 20` (2 exercises)
- ✅ `caloriesBurned: 100`
- ✅ `totalVolume` calculated correctly
- ✅ AI should NOT ask about session grouping (all in one message)

---

## Test Scenario 5: PR Detection

### Turn 6: Log Exercise with New Personal Record

**User Prompt:**

```
I just hit bench press 3x8 at 35 kg!
```

**Expected AI Response:**

```
🎉 NEW PR! Bench Press 3x8 @ 35 kg - that's 5 kg more than your previous best (30 kg from [date])! Total volume: 840 kg. Should I log this?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged! Great work on that PR! 💪
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId5}` (NEW ID)

```json
{
  "type": "strength_training",
  "name": "Chest Workout",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 8,
      "weight": 35,
      "unit": "kg",
      "isPR": true,  // ✅ PR DETECTED!
      "previousBest": {
        "weight": 30,
        "unit": "kg",
        "date": "2025-11-07T..." (from Turn 1)
      }
    }
  ],
  "totalVolume": 840,  // 3 × 8 × 35 = 840
  "duration": 10,
  "caloriesBurned": 50,
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Exercise has `isPR: true`
- ✅ Has `previousBest` object with old weight + date
- ✅ AI celebrated the PR in confirmation message
- ✅ Calories still calculated

---

## Test Scenario 6: Session Grouping After Time Window Expires

### Turn 7: Log Exercise After 60+ Minutes

**Setup:** Wait 65 minutes, or manually set timestamp in test

**User Prompt:**

```
I did shoulder press 3x10 at 20 kg
```

**Expected AI Response:**

```
Shoulder Press 3x10 @ 20 kg. Should I log this?
```

_(AI should NOT find recent sessions because >60 minutes have passed)_

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged! Shoulder Workout (10 min, ~50 calories). 💪
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId6}` (NEW ID - NOT grouped)

```json
{
  "type": "strength_training",
  "name": "Shoulder Workout",
  "exercises": [
    {
      "name": "Shoulder Press",
      "sets": 3,
      "reps": 10,
      "weight": 20,
      "unit": "kg",
      "isPR": false
    }
  ],
  "totalVolume": 600,
  "duration": 10,
  "caloriesBurned": 50,
  "timestamp": "2025-11-07T..." (65+ minutes after Turn 6),
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ New separate session created
- ✅ AI did NOT ask about adding to previous workout
- ✅ Time window logic working correctly

---

## Test Scenario 7: Sport Activity (Calorie Estimation)

### Turn 8: Log Sport/Class Activity

**User Prompt:**

```
I played basketball for an hour
```

**Expected AI Response:**

```
Fun! How intense was the game? Pick-up game or competitive?
```

**User Prompt:**

```
Pretty competitive, full court
```

**Expected AI Response:**

```
Basketball for 60 minutes - high intensity! Based on your weight (160 lbs), I estimate approximately 480 calories burned. Should I log this?
```

**User Prompt:**

```
Yes
```

**Expected AI Response:**

```
✅ Logged! Great cardio workout! 🏀
```

**Expected in Firestore:**
Path: `activities/{userId}/sessions/{sessionId7}` (NEW ID)

```json
{
  "type": "sport",
  "name": "Basketball",
  "duration": 60,
  "intensity": "high",
  "caloriesBurned": 480, // AI calculated based on user weight
  "timestamp": "2025-11-07T...",
  "createdAt": "2025-11-07T...",
  "loggedVia": "chat",
  "notes": ""
}
```

**Verify:**

- ✅ Has `caloriesBurned: 480`
- ✅ Has `intensity: "high"`
- ✅ NO `exercises` array (sport doesn't use that)

---

## Summary Checklist

After running all tests, verify in Firestore:

**Total Sessions Created:** 7 sessions

1. ✅ Chest & Arms Workout (Turn 1 + Turn 2 grouped) - 2 exercises
2. ✅ Leg Workout (Turn 3) - 1 exercise
3. ✅ Running (Turn 4) - cardio
4. ✅ Back Workout (Turn 5) - 2 exercises
5. ✅ Chest Workout with PR (Turn 6) - 1 exercise
6. ✅ Shoulder Workout (Turn 7) - 1 exercise
7. ✅ Basketball (Turn 8) - sport

**Key Verifications:**

- [ ] Session 1 has 2 exercises (bench + biceps) - NOT 2 separate sessions
- [ ] All strength sessions have `caloriesBurned` field
- [ ] All strength sessions have `duration` field
- [ ] Session 5 has `isPR: true` on bench press
- [ ] Cardio and sport activities have calories calculated
- [ ] No session grouping happened for cardio/sport
- [ ] Time window logic prevents grouping after 60+ minutes

---

## Known Issues to Watch For

1. **Empty Text Bug:** AI may return empty text after tool calls

   - Expected: Contextual celebration message
   - Actual: "✅ Done!" (fallback)
   - This is the documented Phase 2.5 issue

2. **Placeholder IDs:** If AI tries to use fake session IDs

   - updateActivity will REJECT with error message
   - AI should call findRecentActivities first

3. **Missing findRecentActivities Call:** AI might forget to check
   - Would create duplicate sessions instead of grouping
   - Monitor logs for "🔧 Executing findRecentActivities tool"

---

## Success Criteria

✅ **PASS** if:

- Session grouping works (Turn 1 + Turn 2 = 1 session)
- All strength sessions have calories
- PR detection still works
- Time window prevents late grouping
- Cardio/sport activities work normally

❌ **FAIL** if:

- Turn 1 + Turn 2 create 2 separate sessions
- Strength sessions missing calories
- updateActivity uses placeholder IDs
- Sessions grouped after 60+ minutes

---

## Firestore Query to Check Results

```javascript
// Firebase Console Query
db.collection("activities")
  .doc(userId)
  .collection("sessions")
  .orderBy("createdAt", "desc")
  .get()
  .then((snapshot) => {
    console.log(`Total sessions: ${snapshot.size}`);
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `${data.name}: ${data.exercises?.length || 0} exercises, ${
          data.caloriesBurned
        } cal`
      );
    });
  });
```

Expected output:

```
Total sessions: 7
Basketball: 0 exercises, 480 cal
Shoulder Workout: 1 exercises, 50 cal
Chest Workout: 1 exercises, 50 cal
Back Workout: 2 exercises, 100 cal
Running: 0 exercises, 300 cal
Leg Workout: 1 exercises, 50 cal
Chest & Arms Workout: 2 exercises, 100 cal
```
