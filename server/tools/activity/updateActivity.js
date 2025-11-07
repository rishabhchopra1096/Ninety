/*
 * ============================================================================
 * TOOL: updateActivity
 * ============================================================================
 *
 * PURPOSE:
 * Updates an existing activity/workout session. Primarily used for adding
 * exercises to an ongoing strength training session (session grouping).
 *
 * WHEN AI USES THIS:
 * - User logs "bench press 3x8" → Creates session
 * - User logs "bicep curls 3x8" 2 minutes later → AI asks "Add to current workout?"
 * - User confirms → AI calls updateActivity to add bicep curls to the session
 *
 * EXAMPLE WORKFLOW:
 * User: "I did bench press 3x8 at 185 lbs" → Creates session with 1 exercise
 * User: "Now bicep curls 3x8 at 10 kg"
 * → AI calls findRecentActivities → Finds bench press session
 * → AI asks: "Add this to your current workout?"
 * → User: "Yes"
 * → AI calls updateActivity({ sessionId: "abc123", updateRequest: "add bicep curls 3x8 at 10 kg" })
 * → Result: Session now has 2 exercises, recalculated totalVolume
 *
 * HOW IT WORKS:
 * 1. Accepts: session ID + update request (natural language OR structured data)
 * 2. Fetches existing session from Firestore
 * 3. Adds new exercise(s) to the exercises array
 * 4. Recalculates totalVolume (sum of all sets × reps × weight)
 * 5. Re-checks for PRs on all exercises
 * 6. Updates session in Firestore
 *
 * IMPORTANT:
 * The session ID MUST come from findRecentActivities - NEVER use placeholder IDs.
 *
 * ============================================================================
 */

const { tool } = require("ai");
const { z } = require("zod");

module.exports = (admin, db) =>
  tool({
    // Description tells the AI when and how to use this tool
    description:
      "Add exercises to an existing strength training session. Use for session grouping when user logs multiple exercises consecutively. CRITICAL: You MUST call findRecentActivities first to get the session ID. NEVER use placeholder IDs.",

    // Define parameters
    inputSchema: z.object({
      // The Firestore document ID (MUST come from findRecentActivities)
      sessionId: z
        .string()
        .describe(
          'The session ID from findRecentActivities (NEVER use placeholders like "xyz789" or "abc123")'
        ),

      // New exercise(s) to add to the session
      exercises: z
        .array(
          z.object({
            name: z.string().describe("Exercise name (e.g., 'Bench Press')"),
            sets: z.number().describe("Number of sets"),
            reps: z.number().describe("Number of reps per set"),
            weight: z.number().describe("Weight lifted"),
            unit: z
              .enum(["lbs", "kg"])
              .describe("Weight unit (lbs or kg)"),
          })
        )
        .describe("Array of new exercises to add to the session"),

      // Optional: Update session name (e.g., "Chest & Biceps" if adding biceps to chest workout)
      name: z
        .string()
        .optional()
        .describe(
          'Optional: Update session name (e.g., "Chest & Biceps Workout")'
        ),

      // Optional: Add notes
      notes: z
        .string()
        .optional()
        .describe("Optional: Add notes to the session"),
    }),

    // This function executes when AI calls the tool
    execute: async ({ sessionId, exercises, name, notes }, { abortSignal }) => {
      console.log("🔧 Executing updateActivity tool");
      console.log("   Session ID:", sessionId);
      console.log("   Adding exercises:", exercises.length);

      /*
       * VALIDATION: Reject placeholder IDs
       */
      const placeholders = [
        "xyz789",
        "abc123",
        "12345",
        "sessionId_placeholder",
        "session_placeholder",
      ];
      if (placeholders.includes(sessionId)) {
        console.error(
          "❌ REJECTED: AI used placeholder ID instead of calling findRecentActivities"
        );
        return {
          success: false,
          message:
            'ERROR: You must call findRecentActivities first to get the real session ID. Never use placeholder IDs like "xyz789".',
        };
      }

      /*
       * VALIDATION: Check if ID looks real
       */
      if (sessionId.length < 10) {
        console.error(
          "❌ REJECTED: Session ID too short, likely a placeholder:",
          sessionId
        );
        return {
          success: false,
          message:
            "ERROR: Invalid session ID. Call findRecentActivities to get the real ID from the database.",
        };
      }

      // Get the current user's ID
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot update activity"
        );
        return {
          success: false,
          message: "Database unavailable. Please try again later.",
        };
      }

      try {
        /*
         * STEP 1: Fetch existing session from Firestore
         */
        const sessionRef = db
          .collection("activities")
          .doc(userId)
          .collection("sessions")
          .doc(sessionId);

        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
          console.error("❌ Session not found in Firestore:", sessionId);
          return {
            success: false,
            message:
              "Session not found. It may have been deleted or the ID is incorrect.",
          };
        }

        const existingSession = sessionDoc.data();
        console.log("📦 Existing session fetched:", {
          name: existingSession.name,
          exerciseCount: existingSession.exercises?.length || 0,
        });

        /*
         * VALIDATION: Ensure this is a strength training session
         */
        if (existingSession.type !== "strength_training") {
          console.error(
            "❌ REJECTED: Cannot add exercises to non-strength training activity"
          );
          return {
            success: false,
            message:
              "Can only add exercises to strength training sessions, not " +
              existingSession.type,
          };
        }

        /*
         * STEP 2: Add PR detection for new exercises
         */
        console.log("🔍 Checking for PRs on new exercises...");

        const exercisesWithPRs = await Promise.all(
          exercises.map(async (exercise) => {
            try {
              // Query past activities for this exercise (same logic as logActivity.js)
              const activitiesRef = db
                .collection("activities")
                .doc(userId)
                .collection("sessions");

              const snapshot = await activitiesRef
                .where("type", "==", "strength_training")
                .orderBy("timestamp", "desc")
                .limit(50) // Check last 50 workouts
                .get();

              let previousBest = null;
              let previousBestWeight = 0;

              // Loop through past sessions to find this exercise
              snapshot.forEach((doc) => {
                const session = doc.data();
                if (session.exercises) {
                  // Look for same exercise in this session
                  const pastExercise = session.exercises.find(
                    (e) =>
                      e.name.toLowerCase() === exercise.name.toLowerCase()
                  );

                  if (pastExercise && pastExercise.weight) {
                    // Convert to same unit for comparison
                    let pastWeight = pastExercise.weight;
                    if (pastExercise.unit !== exercise.unit) {
                      // Convert if units differ (lbs <-> kg)
                      if (
                        pastExercise.unit === "kg" &&
                        exercise.unit === "lbs"
                      ) {
                        pastWeight = pastWeight * 2.20462; // kg to lbs
                      } else if (
                        pastExercise.unit === "lbs" &&
                        exercise.unit === "kg"
                      ) {
                        pastWeight = pastWeight / 2.20462; // lbs to kg
                      }
                    }

                    // Track the highest weight found
                    if (pastWeight > previousBestWeight) {
                      previousBestWeight = pastWeight;
                      previousBest = {
                        weight: pastExercise.weight,
                        unit: pastExercise.unit,
                        date: session.timestamp.toDate().toISOString(),
                      };
                    }
                  }
                }
              });

              // Check if current weight is a PR
              const isPR =
                previousBestWeight > 0 && exercise.weight > previousBestWeight;

              console.log(
                `   ${exercise.name}: ${exercise.weight} ${exercise.unit}${isPR ? " 🎉 NEW PR!" : ""}`
              );

              return {
                ...exercise,
                isPR: isPR || false,
                previousBest: isPR ? previousBest : null,
              };
            } catch (error) {
              console.error(
                `❌ Error checking PR for ${exercise.name}:`,
                error
              );
              // If PR check fails, still add the exercise without PR marker
              return { ...exercise, isPR: false };
            }
          })
        );

        /*
         * STEP 3: Merge new exercises with existing exercises
         */
        const allExercises = [
          ...(existingSession.exercises || []),
          ...exercisesWithPRs,
        ];

        /*
         * STEP 4: Recalculate totalVolume (sum of all sets × reps × weight)
         */
        const totalVolume = allExercises.reduce((sum, exercise) => {
          return sum + exercise.sets * exercise.reps * exercise.weight;
        }, 0);

        console.log("📊 Recalculated totalVolume:", totalVolume);

        /*
         * STEP 5: Build update object
         */
        const updateData = {
          exercises: allExercises,
          totalVolume: totalVolume,
          // Update timestamp to reflect the latest exercise time
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Update session name if provided
        if (name !== undefined) {
          updateData.name = name;
        }

        // Update or append notes if provided
        if (notes !== undefined) {
          if (existingSession.notes) {
            updateData.notes = existingSession.notes + "\n" + notes;
          } else {
            updateData.notes = notes;
          }
        }

        /*
         * STEP 6: Save to Firestore
         */
        await sessionRef.update(updateData);

        console.log("✅ Activity updated in Firestore:", sessionId);

        /*
         * STEP 7: Build response with PR information
         */
        const response = {
          success: true,
          sessionId: sessionId,
          message: `Added ${exercises.length} exercise(s) to session`,
          updatedSession: {
            id: sessionId,
            name: name || existingSession.name,
            type: "strength_training",
            exerciseCount: allExercises.length,
            totalVolume: totalVolume,
          },
        };

        // Add PR information if any new PRs were achieved
        const prs = exercisesWithPRs.filter((e) => e.isPR);
        if (prs.length > 0) {
          response.prsAchieved = prs.map((e) => ({
            exercise: e.name,
            weight: e.weight,
            unit: e.unit,
            previousBest: e.previousBest,
          }));
        }

        return response;
      } catch (error) {
        // If something goes wrong
        console.error("❌ Error updating activity in Firestore:", error);

        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }
    },
  });
