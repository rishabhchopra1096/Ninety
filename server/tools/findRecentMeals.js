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

const { tool } = require("ai");
const { z } = require("zod");

module.exports = (admin, db) =>
  tool({
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
        console.log(`✅ Found ${meals.length} recent meals from Firestore`);

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
  });
