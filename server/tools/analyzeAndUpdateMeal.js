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

const { tool } = require("ai");
const { z } = require("zod");
const { generateText } = require("ai");
const { anthropic } = require("@ai-sdk/anthropic");

module.exports = (admin, db) =>
  tool({
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
  });
