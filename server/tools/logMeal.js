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

const { tool } = require("ai");
const { z } = require("zod");

module.exports = (admin, db) =>
  tool({
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
              .describe('Quantity with unit (e.g., "2 eggs", "1 cup")'),
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
        .optional()
        .describe(
          "ISO timestamp of when meal was eaten (use new Date().toISOString())"
        ),

      // Optional notes (e.g., "eaten at restaurant", "homemade")
      notes: z
        .string()
        .optional()
        .describe("Optional notes about the meal"),
    }),

    // This function executes when AI calls the tool
    execute: async ({ mealType, foods, timestamp, notes }, { abortSignal }) => {
      // Log that this tool is executing
      console.log("🔧 Executing logMeal tool");

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot log meal"
        );
        return {
          success: false,
          message: "Database unavailable. Please try again later.",
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
        // Convert ISO string to Firestore Timestamp with fallback to current time
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        if (isNaN(dateObj.getTime())) {
          console.warn(
            `⚠️ Invalid timestamp "${timestamp}", using current time`
          );
          dateObj = new Date();
        }

        const mealData = {
          // Meal type (breakfast/lunch/dinner/snack)
          mealType,

          // Timestamp of when meal was eaten
          timestamp: admin.firestore.Timestamp.fromDate(dateObj),

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
  });
