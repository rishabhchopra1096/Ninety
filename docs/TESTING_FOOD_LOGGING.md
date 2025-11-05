# Food Logging Test Scenarios

Comprehensive test cases to ensure conversational food logging works naturally for real users.

---

## 1. Basic Logging Scenarios

### 1.1 Single Food Item
- [x] "I had 2 eggs for breakfast" → Should log without asking for preparation method initially
- [ ] "Just ate an apple" → Should estimate and confirm
- [ ] "Had coffee this morning" → Should ask if user wants to log (minimal calories)
- [ ] "Ate a banana" → Should log with standard size estimate

### 1.2 Multiple Food Items
- [x] "I had eggs, toast, and coffee" → Should ask for quantities for each
- [ ] "Breakfast was oatmeal with berries and honey" → Should break down components
- [ ] "Had chicken rice and vegetables for lunch" → Should parse all items
- [ ] "Pizza and coke" → Should ask for pizza slices and coke size

### 1.3 Quantities Already Provided
- **ISSUE:** "I had 2 slices of bread" → AI still asks "how many slices?"
  - [ ] Should NOT ask for quantity if already provided
  - [ ] "2 eggs" → Should accept directly
  - [ ] "1 cup of rice" → Should accept directly
  - [ ] "500ml water" → Should accept directly

---

## 2. Natural Language Variations

### 2.1 Tense Variations
- [x] "I had breakfast" (past) → Should log
- [ ] "I'm eating lunch" (present continuous) → Should log
- [ ] "Just finished dinner" (recent past) → Should log
- [ ] "I'll have pasta for dinner" (future) → Should NOT log, just conversation
- [ ] "Planning to eat chicken later" (future planning) → Should NOT log

### 2.2 Casual Language
- [ ] "Grabbed a quick bite" → Should ask what they ate
- [ ] "Snacked on some chips" → Should ask for amount
- [ ] "Had a huge meal" → Should ask for details
- [ ] "Ate way too much pizza" → Should log and ask for quantity
- [ ] "Basically starving, had nothing" → Should acknowledge, not log

### 2.3 Incomplete Information
- [ ] "I ate" → Should ask what they ate
- [ ] "Had lunch" → Should ask what they had
- [ ] "Dinner was good" → Should ask for details
- [ ] "Just ate" → Should ask what and when

---

## 3. Photo Upload Functionality

### 3.1 Clear Photos
- [ ] Upload photo of plated meal → Should recognize main components
- [ ] Upload photo of packaged food with label → Should read nutrition label
- [ ] Upload photo of single item (apple, sandwich) → Should estimate size
- [ ] Upload photo with multiple items → Should identify each item

### 3.2 Ambiguous Photos
- [ ] Upload blurry photo → Should ask for clarification
- [ ] Upload photo of mixed dish (curry, stew) → Should ask for ingredients
- [ ] Upload photo from far away → Should ask for portion estimation
- [ ] Upload photo of partially eaten meal → Should ask if it's before/after

### 3.3 Photo Context Integration
- [ ] Photo after saying "just had lunch" → Should associate with lunch
- [ ] Photo without prior context → Should ask meal type
- [ ] Multiple photos in sequence → Should handle as single meal or separate
- [ ] Photo correction: "Actually that was dinner not lunch" → Should update

---

## 4. Meal Corrections & Updates

### 4.1 Meal Type Corrections
- [x] "Actually that was lunch, not breakfast" → Should update mealType
- [ ] "Wait, that was a snack" → Should update to snack
- [ ] "This should be dinner" → Should update timing and type

### 4.2 Quantity Corrections
- [ ] "Actually I only had 1 egg, not 2" → Should update quantity and recalculate
- [ ] "That was a bigger portion" → Should ask for new estimate
- [ ] "I had more than that" → Should ask how much more

### 4.3 Food Item Corrections
- [ ] "I also had toast with that" → Should add to existing meal
- [x] "I also had butter on the toast" → Should add component
- [ ] "Actually I didn't have the rice" → Should remove item
- [ ] "That was brown rice, not white" → Should update macros

### 4.4 Complete Meal Deletion
- [ ] "Delete that meal" → Should confirm and remove
- [ ] "I didn't actually eat that" → Should offer to delete
- [ ] "Cancel that log" → Should remove entry

---

## 5. Complex Meals & Mixed Dishes

### 5.1 Restaurant/Prepared Meals
- [ ] "I had a burrito bowl from Chipotle" → Should ask for ingredients or use standard estimate
- [ ] "Had a Big Mac" → Should use known nutrition data
- [ ] "Ordered pad thai" → Should estimate or ask for portion size
- [ ] "Ate at McDonald's" → Should ask what they ordered

### 5.2 Home-Cooked Mixed Dishes
- [ ] "Made a stir fry with chicken and veggies" → Should ask for components
- [ ] "Had homemade pasta with meat sauce" → Should break down ingredients
- [ ] "Cooked a curry" → Should ask for protein, vegetables, sauce
- [ ] "Made a smoothie" → Should ask for all ingredients

### 5.3 Multiple Components
- [ ] "Chicken, rice, and broccoli" → Should log all three
- [ ] "Salad with grilled chicken, avocado, and dressing" → Should track all
- [ ] "Burger with fries and a shake" → Should log complete meal

---

## 6. Portion Size Handling

### 6.1 Standard Portions
- [ ] "Small coffee" vs "Large coffee" → Should adjust calories
- [ ] "A handful of nuts" → Should estimate standard handful
- [ ] "Bowl of cereal" → Should ask for bowl size or use standard

### 6.2 Weight-Based
- [ ] "200g chicken breast" → Should accept precise measurement
- [ ] "Half a pound of ground beef" → Should convert and log
- [ ] "8oz steak" → Should log accurately

### 6.3 Volume-Based
- [ ] "1 cup of rice" → Should accept
- [ ] "2 tablespoons of peanut butter" → Should accept
- [ ] "500ml protein shake" → Should log

---

## 7. Daily Summary & Queries

### 7.1 Progress Queries
- [ ] "How many calories have I had today?" → Should provide total
- [ ] "What did I eat for breakfast?" → Should recall breakfast meal
- [ ] "Show me my meals today" → Should list all logged meals
- [ ] "Am I on track?" → Should compare to calorie target

### 7.2 Historical Queries
- [ ] "What did I eat yesterday?" → Should retrieve previous day
- [ ] "How many calories this week?" → Should aggregate weekly
- [ ] "Did I log lunch today?" → Should check and respond

---

## 8. Edge Cases & Error Handling

### 8.1 Unusual Foods
- [ ] "I ate durian" → Should handle less common foods
- [ ] "Had some jollof rice" → Should estimate or ask for details
- [ ] "Ate kimchi" → Should log fermented foods
- [ ] "Had bone broth" → Should handle liquids with nutrition

### 8.2 Alcohol & Drinks
- [ ] "Had 2 beers" → Should log alcohol calories
- [ ] "Glass of wine with dinner" → Should add to meal
- [ ] "Energy drink" → Should log with caffeine note
- [ ] "Fresh juice" → Should ask for size and type

### 8.3 Supplements & Extras
- [ ] "Took a protein shake" → Should log as meal or snack
- [ ] "Had a vitamin" → Should not log (no calories)
- [ ] "Fish oil capsule" → Should ask if user wants to track
- [ ] "Fiber supplement" → Should track fiber

### 8.4 User Errors & Typos
- [ ] "I had chiken" → Should interpret as "chicken"
- [ ] "ate bred" → Should interpret as "bread"
- [ ] "had coffe" → Should interpret as "coffee"
- [ ] Completely unclear input → Should ask for clarification

---

## 9. Multi-Turn Conversations

### 9.1 Building Up a Meal
- [ ] "I had eggs" → "With toast" → "And butter" → Should combine into one meal
- [ ] Gradual additions should update existing meal, not create new entries

### 9.2 Interruptions & Context Switching
- [ ] Log breakfast → Ask about workout → Return to food logging
- [ ] Start logging → User changes topic → Return later
- [ ] Multiple meals in one conversation → Should track separately

---

## 10. Macro Awareness & Nutrition Goals

### 10.1 Macro Queries
- [ ] "How much protein have I had?" → Should calculate total
- [ ] "Am I getting enough fiber?" → Should check against goal
- [ ] "How many carbs in that meal?" → Should recall specific meal

### 10.2 Nutrition Coaching
- [ ] User eating too little → Should suggest more food
- [ ] User over on calories → Should acknowledge, not judge
- [ ] Missing food groups → Should suggest balance
- [ ] High protein request → Should help find protein sources

---

## 11. Known Issues to Fix

### High Priority
1. **Overly insistent quantity asking**: AI asks for quantity even when provided
   - "I had 2 eggs" → Should NOT ask "how many eggs?"
   - Fix: Improve prompt to recognize quantities in initial message

2. **Photo upload untested**: Need to verify image analysis works
   - Test with actual meal photos
   - Verify calorie estimation accuracy
   - Check if context is maintained

3. **Duplicate meal prevention**: Ensure corrections update, don't duplicate
   - ✅ Fixed for meal type changes
   - ✅ Fixed for adding foods to existing meal
   - Need to test: Deleting items from meal

### Medium Priority
4. **Natural language quantity recognition**: "a handful", "a bowl", "a glass"
5. **Mixed dish breakdown**: Complex recipes with multiple ingredients
6. **Historical meal editing**: "Update my breakfast from yesterday"

### Low Priority
7. **Meal timing auto-detection**: Log at 7am should default to breakfast
8. **Repeated meals**: "I had the same as yesterday"
9. **Meal templates**: "Log my usual breakfast"

---

## Testing Checklist

Before considering food logging complete:

- [ ] All basic scenarios work (single item, multiple items)
- [ ] Corrections work (meal type, quantity, adding/removing items)
- [ ] Photo uploads work and integrate with conversation
- [ ] Natural language is properly understood (no robotic interactions)
- [ ] Quantities provided in initial message are recognized
- [ ] Edge cases handled gracefully (typos, unclear input)
- [ ] Daily summaries and queries work
- [ ] No duplicate meals created during corrections
- [ ] Macro tracking is accurate
- [ ] User experience feels conversational, not form-filling

---

## Success Criteria

Food logging should feel like:
- ✅ **Talking to a friend**: Natural, conversational, understanding
- ✅ **Smart, not annoying**: Doesn't ask for info already provided
- ✅ **Forgiving**: Handles typos, variations, casual language
- ✅ **Helpful**: Suggests, guides, but doesn't force
- ✅ **Accurate**: Correct calorie and macro estimates

Food logging should NOT feel like:
- ❌ **Filling out a form**: Rigid, step-by-step interrogation
- ❌ **Repetitive**: Asking the same question multiple times
- ❌ **Robotic**: Unable to understand natural language
- ❌ **Judgmental**: Criticizing food choices
- ❌ **Confusing**: Creating duplicate entries or losing context
