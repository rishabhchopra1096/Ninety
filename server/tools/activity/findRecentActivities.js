/*
 * ============================================================================
 * TOOL: findRecentActivities
 * ============================================================================
 *
 * PURPOSE:
 * Searches the database for the user's recent activities. This is CRITICAL for
 * the session grouping workflow because the AI needs to see what activities exist
 * before it can decide whether to group a new exercise into an existing session
 * or create a new session.
 *
 * WHEN AI USES THIS:
 * - User logs a strength exercise (e.g., "I did bicep curls 3x8")
 * - AI needs to check if there's a recent strength training session
 * - AI decides: Add to existing session OR create new session
 *
 * EXAMPLE WORKFLOW:
 * User: "I did bench press 3x8 at 185 lbs" → Creates new session
 * User: "Now I did bicep curls 3x8 at 10 kg" → AI calls findRecentActivities
 * → Finds bench press session from 2 minutes ago
 * → AI asks: "Add this to your current workout session?"
 * → User confirms → AI calls updateActivity to add bicep curls to that session
 *
 * HOW IT WORKS:
 * 1. AI calls this tool (with optional time window)
 * 2. Tool queries Firestore for user's recent activities
 * 3. Tool returns array of activities with their IDs
 * 4. AI should READ these results and identify if new exercise belongs to existing session
 * 5. AI should ask user for confirmation
 * 6. AI should then call updateActivity with the real session ID
 *
 * ============================================================================
 */

const { tool } = require("ai");
const { z } = require("zod");

module.exports = (admin, db) =>
  tool({
    // Tell AI what this tool does and when to use it
    description:
      "Find recent activities/workout sessions. Use when logging strength exercises to check if user is continuing an existing workout session. Returns actual session IDs needed for adding exercises to existing sessions.",

    // Define what parameters this tool accepts
    inputSchema: z.object({
      // How many activities to return (default is 5)
      limit: z
        .number()
        .optional()
        .describe("Maximum number of activities to return (default: 5)"),

      // How far back to look in minutes (default is 60 minutes)
      withinMinutes: z
        .number()
        .optional()
        .describe(
          "Only return activities from the last N minutes (default: 60)"
        ),

      // Optional: filter by activity type (e.g., only strength_training)
      type: z
        .string()
        .optional()
        .describe(
          'Optional: filter by activity type (e.g., "strength_training")'
        ),
    }),

    // This function executes when AI calls the tool
    execute: async ({ limit, withinMinutes, type }, { abortSignal }) => {
      // Log that this tool is being executed
      console.log("🔧 Executing findRecentActivities tool");
      console.log(
        `   Looking for activities within ${withinMinutes || 60} minutes`
      );
      if (type) {
        console.log(`   Filtering by type: ${type}`);
      }

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot find activities"
        );
        return {
          activities: [],
          error: "Database unavailable. Please try again later.",
        };
      }

      // If we reach here, Firestore IS available
      try {
        // Get a reference to this user's activities collection in Firestore
        // Path: activities/{userId}/sessions
        const activitiesRef = db
          .collection("activities")
          .doc(userId)
          .collection("sessions");

        // Build the query:
        // - orderBy('timestamp', 'desc'): Sort by time, newest first
        // - limit(5): Only get the most recent 5 activities (or specified limit)
        let query = activitiesRef
          .orderBy("timestamp", "desc")
          .limit(limit || 5);

        // Execute the query and get results
        const snapshot = await query.get();

        // Create array to store the activities we'll return
        let activities = [];

        // Calculate the cutoff time if withinMinutes is specified
        const cutoffTime = withinMinutes
          ? new Date(Date.now() - withinMinutes * 60 * 1000)
          : null;

        // Loop through each document (activity) that Firestore returned
        snapshot.forEach((doc) => {
          // Get all the data from this activity document
          const data = doc.data();

          // Convert Firestore timestamp to Date object
          const activityTime = data.timestamp?.toDate();

          // Skip this activity if it's outside the time window
          if (cutoffTime && activityTime && activityTime < cutoffTime) {
            return; // Skip to next activity
          }

          // Skip this activity if type filter is specified and doesn't match
          if (type && data.type !== type) {
            return; // Skip to next activity
          }

          // Build the activity object to return
          const activity = {
            // ✅ CRITICAL: Include the Firestore document ID
            // This is what updateActivity needs to know which session to update
            id: doc.id,

            // Activity type (strength_training, cardio, sport, etc.)
            type: data.type,

            // Activity name
            name: data.name,

            // When the activity happened (ISO string format)
            timestamp: activityTime?.toISOString(),

            // Optional fields that may or may not exist
            duration: data.duration,
            notes: data.notes || "",
          };

          // Add type-specific fields
          if (data.type === "strength_training") {
            // For strength training, include the exercises array and totalVolume
            activity.exercises = data.exercises || [];
            activity.totalVolume = data.totalVolume || 0;
          } else {
            // For other activities, include distance, intensity, calories
            if (data.distance !== undefined) {
              activity.distance = data.distance;
              activity.distanceUnit = data.distanceUnit;
            }
            if (data.intensity !== undefined) {
              activity.intensity = data.intensity;
            }
            if (data.caloriesBurned !== undefined) {
              activity.caloriesBurned = data.caloriesBurned;
            }
          }

          // Add this activity to our results array
          activities.push(activity);
        });

        // Log how many activities we found
        console.log(
          `✅ Found ${activities.length} recent activities from Firestore`
        );

        // Return the activities array wrapped in an object
        // This matches the structure expected by the AI
        return { activities };
      } catch (error) {
        // If something goes wrong (Firestore error, etc.)
        console.error("❌ Error finding activities in Firestore:", error);

        // Return empty array so the AI knows no activities were found
        return { activities: [] };
      }
    },
  });
