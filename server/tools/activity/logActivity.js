/*
 * ============================================================================
 * TOOL: logActivity
 * ============================================================================
 *
 * PURPOSE:
 * Log physical activities - strength training, cardio, classes, sports, etc.
 * Supports automatic PR detection for strength training.
 *
 * WHEN AI USES THIS:
 * - User says: "I did bench press, 3 sets of 8 at 185 lbs"
 * - User says: "I went for a 30-minute run"
 * - User says: "Just finished a salsa class"
 * - After AI has shown breakdown and gotten confirmation
 *
 * IMPORTANT: AI should ALWAYS confirm with user before calling this tool!
 * Show the breakdown, celebrate PRs if applicable, ask "Should I log this?"
 *
 * ============================================================================
 */

const { tool } = require("ai");
const { z } = require("zod");

module.exports = (admin, db) =>
  tool({
    // Description tells the AI when to use this tool
    description:
      "Log a physical activity to the user's activity log. Use when user mentions doing exercise, sports, or any physical activity.",

    /*
     * FLEXIBLE ACTIVITY SCHEMA
     *
     * This schema supports ANY type of physical activity by making most fields optional.
     * AI decides what fields to populate based on the activity type.
     *
     * Design Philosophy:
     * - Single flexible schema vs rigid discriminated union
     * - AI determines what data makes sense for each activity
     * - Supports standard activities (gym, running) AND flexible ones (walking, yoga, sports)
     *
     * Examples:
     * - Strength training → includes exercises array
     * - Cardio → includes duration, distance, intensity
     * - Sports/Classes → includes duration, intensity, calories
     * - Walking → duration, distance (flexible!)
     * - Yoga → duration, intensity (flexible!)
     */
    inputSchema: z.object({
      // REQUIRED FIELDS
      type: z
        .enum([
          "strength_training",
          "cardio",
          "sport",
          "class",
          "flexibility",
          "other",
        ])
        .describe(
          "Activity category - use 'sport' for basketball/tennis, 'flexibility' for yoga/stretching, 'other' for miscellaneous activities"
        ),

      name: z
        .string()
        .describe(
          "Activity name (e.g., 'Running', 'Basketball', 'Yoga', 'Walking'). For strength training with multiple exercises, use session name like 'Chest Workout'."
        ),

      // OPTIONAL FIELDS - AI populates based on activity type
      duration: z
        .number()
        .optional()
        .describe("Duration in minutes (for most activities)"),

      // Strength training specific
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
        .optional()
        .describe(
          "Array of exercises with sets/reps/weight - ONLY for strength_training type"
        ),

      // Cardio/distance-based activities
      distance: z
        .number()
        .optional()
        .describe(
          "Distance covered (for running, walking, cycling, etc.) - numeric value only"
        ),

      distanceUnit: z
        .enum(["miles", "km"])
        .optional()
        .describe("Distance unit - required if distance is provided"),

      intensity: z
        .enum(["low", "moderate", "high"])
        .optional()
        .describe(
          "Activity intensity (low/moderate/high) - useful for cardio, classes, sports"
        ),

      caloriesBurned: z
        .number()
        .optional()
        .describe(
          "Estimated calories burned - AI should calculate based on user's weight and activity details"
        ),

      timestamp: z
        .string()
        .optional()
        .describe(
          "ISO timestamp (use new Date().toISOString()) - defaults to now if not provided"
        ),

      notes: z
        .string()
        .optional()
        .describe("Optional notes from user or AI observations"),
    }),

    // This function executes when AI calls the tool
    execute: async (params, { abortSignal }) => {
      console.log("🔧 Executing logActivity tool");
      console.log("   Activity type:", params.type);

      // Get the current user's ID (set by the chat endpoint)
      const userId = global.currentUserId || "anonymous";

      // Check if Firestore is available - fail loudly if not
      if (!db) {
        console.error(
          "❌ CRITICAL: Firestore not initialized - cannot log activity"
        );
        return {
          success: false,
          message: "Database unavailable. Please try again later.",
        };
      }

      try {
        // Convert ISO string to Firestore Timestamp with fallback to current time
        const dateObj = params.timestamp
          ? new Date(params.timestamp)
          : new Date();
        if (isNaN(dateObj.getTime())) {
          console.warn(
            `⚠️ Invalid timestamp "${params.timestamp}", using current time`
          );
          dateObj = new Date();
        }

        /*
         * ========================================================================
         * FLEXIBLE ACTIVITY DATA BUILDER
         * ========================================================================
         *
         * Build activity data dynamically based on what fields AI provided.
         * This approach supports ANY activity type without rigid type checking.
         */

        // Start with base fields (always present)
        const activityData = {
          type: params.type,
          name: params.name,
          timestamp: admin.firestore.Timestamp.fromDate(dateObj),
          notes: params.notes || "",
          loggedVia: "chat",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        /*
         * STRENGTH TRAINING: PR DETECTION & VOLUME CALCULATION
         *
         * Only runs if exercises array is provided (strength training)
         */
        if (params.exercises && params.exercises.length > 0) {
          console.log("   Processing strength training with PR detection...");

          const exercisesWithPRs = await Promise.all(
            params.exercises.map(async (exercise) => {
              try {
                // Query past activities for this exercise
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
                // If PR check fails, still log the exercise without PR marker
                return { ...exercise, isPR: false };
              }
            })
          );

          // Calculate total volume (sets × reps × weight)
          const totalVolume = exercisesWithPRs.reduce((sum, exercise) => {
            return sum + exercise.sets * exercise.reps * exercise.weight;
          }, 0);

          // Add strength training specific fields
          activityData.exercises = exercisesWithPRs;
          activityData.totalVolume = totalVolume;
        }

        /*
         * ADD OPTIONAL FIELDS (if AI provided them)
         *
         * This allows flexible activities like:
         * - Walking → duration + distance
         * - Yoga → duration + intensity
         * - Basketball → duration + intensity + calories
         * - Running → duration + distance + intensity + calories
         */
        if (params.duration !== undefined) {
          activityData.duration = params.duration;
        }

        if (params.distance !== undefined) {
          activityData.distance = params.distance;
          activityData.distanceUnit = params.distanceUnit || "miles";
        }

        if (params.intensity !== undefined) {
          activityData.intensity = params.intensity;
        }

        if (params.caloriesBurned !== undefined) {
          activityData.caloriesBurned = params.caloriesBurned;
        }

        /*
         * SAVE TO FIRESTORE
         *
         * Path: activities/{userId}/sessions/{auto-generated-id}
         */
        const activitiesRef = db
          .collection("activities")
          .doc(userId)
          .collection("sessions");

        const docRef = await activitiesRef.add(activityData);

        console.log("✅ Activity logged to Firestore:", docRef.id);

        // Return success with PR information if applicable
        const response = {
          success: true,
          activityId: docRef.id,
          message: "Activity logged successfully",
        };

        // Add PR information if exercises were logged (strength training)
        if (activityData.exercises && activityData.exercises.length > 0) {
          const prs = activityData.exercises.filter((e) => e.isPR);
          if (prs.length > 0) {
            response.prsAchieved = prs.map((e) => ({
              exercise: e.name,
              weight: e.weight,
              unit: e.unit,
              previousBest: e.previousBest,
            }));
          }
        }

        return response;
      } catch (error) {
        // If something goes wrong (network error, permission error, etc.)
        console.error("❌ Error logging activity to Firestore:", error);

        // Return error to the AI
        return { success: false, message: `Error: ${error.message}` };
      }
    },
  });
