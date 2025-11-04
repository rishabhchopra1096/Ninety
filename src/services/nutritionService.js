import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Log a new meal to Firestore
 * @param {string} userId - The user's ID
 * @param {Object} mealData - The meal object
 * @returns {Promise<string>} The saved meal ID
 */
export const logMeal = async (userId, mealData) => {
  try {
    console.log('🍽️ Logging meal for user:', userId);
    console.log('   Meal data:', JSON.stringify(mealData, null, 2));

    const mealsRef = collection(db, 'nutrition', userId, 'meals');

    // Calculate totals from foods array
    const totals = mealData.foods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories || 0),
      protein: acc.protein + (food.protein || 0),
      carbs: acc.carbs + (food.carbs || 0),
      fats: acc.fats + (food.fats || 0),
      fiber: acc.fiber + (food.fiber || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

    const mealDoc = {
      mealType: mealData.mealType,
      timestamp: Timestamp.fromDate(mealData.timestamp || new Date()),
      foods: mealData.foods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
      totalFiber: totals.fiber,
      photoUrl: mealData.photoUrl || null,
      photoUrls: mealData.photoUrls || [],
      notes: mealData.notes || '',
      loggedVia: mealData.loggedVia || 'chat',
      createdAt: Timestamp.fromDate(new Date()),
    };

    const docRef = await addDoc(mealsRef, mealDoc);
    console.log('✅ Meal saved to Firestore:', docRef.id);
    console.log('   Total calories:', totals.calories);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving meal to Firestore:', error);
    throw error;
  }
};

/**
 * Update an existing meal
 * @param {string} userId - The user's ID
 * @param {string} mealId - The meal document ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<void>}
 */
export const updateMeal = async (userId, mealId, updates) => {
  try {
    console.log('✏️ Updating meal:', mealId);
    console.log('   Updates:', JSON.stringify(updates, null, 2));

    const mealRef = doc(db, 'nutrition', userId, 'meals', mealId);

    // If foods array is updated, recalculate totals
    if (updates.foods) {
      const totals = updates.foods.reduce((acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fats: acc.fats + (food.fats || 0),
        fiber: acc.fiber + (food.fiber || 0),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

      updates.totalCalories = totals.calories;
      updates.totalProtein = totals.protein;
      updates.totalCarbs = totals.carbs;
      updates.totalFats = totals.fats;
      updates.totalFiber = totals.fiber;
    }

    updates.updatedAt = Timestamp.fromDate(new Date());

    await updateDoc(mealRef, updates);
    console.log('✅ Meal updated successfully');
  } catch (error) {
    console.error('❌ Error updating meal:', error);
    throw error;
  }
};

/**
 * Get meals for a specific date
 * @param {string} userId - The user's ID
 * @param {Date} date - The date to get meals for
 * @returns {Promise<Array>} Array of meals
 */
export const getMeals = async (userId, date) => {
  try {
    console.log('📅 Getting meals for date:', date.toDateString());

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const mealsRef = collection(db, 'nutrition', userId, 'meals');
    const q = query(
      mealsRef,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const meals = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      meals.push({
        id: doc.id,
        mealType: data.mealType,
        timestamp: data.timestamp?.toDate() || new Date(),
        foods: data.foods || [],
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFats: data.totalFats || 0,
        totalFiber: data.totalFiber || 0,
        photoUrl: data.photoUrl,
        photoUrls: data.photoUrls || [],
        notes: data.notes || '',
        loggedVia: data.loggedVia || 'chat',
        createdAt: data.createdAt?.toDate(),
      });
    });

    console.log(`✅ Found ${meals.length} meals for ${date.toDateString()}`);
    return meals;
  } catch (error) {
    console.error('❌ Error getting meals:', error);
    throw error;
  }
};

/**
 * Find recent meals (for AI context when editing)
 * @param {string} userId - The user's ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} Array of recent meals
 */
export const findRecentMeals = async (userId, filters = {}) => {
  try {
    console.log('🔍 Finding recent meals with filters:', filters);

    const mealsRef = collection(db, 'nutrition', userId, 'meals');
    let q = query(mealsRef, orderBy('timestamp', 'desc'), firestoreLimit(filters.limit || 10));

    // Apply filters if provided
    if (filters.mealType) {
      q = query(
        mealsRef,
        where('mealType', '==', filters.mealType),
        orderBy('timestamp', 'desc'),
        firestoreLimit(filters.limit || 10)
      );
    }

    if (filters.date) {
      const targetDate = new Date(filters.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(
        mealsRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('timestamp', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const meals = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // If containsFood filter, check if any food matches
      if (filters.containsFood) {
        const containsFood = data.foods?.some(food =>
          food.name.toLowerCase().includes(filters.containsFood.toLowerCase())
        );
        if (!containsFood) return; // Skip this meal
      }

      meals.push({
        id: doc.id,
        mealType: data.mealType,
        timestamp: data.timestamp?.toDate() || new Date(),
        foods: data.foods || [],
        totalCalories: data.totalCalories || 0,
        totalProtein: data.totalProtein || 0,
        totalCarbs: data.totalCarbs || 0,
        totalFats: data.totalFats || 0,
        totalFiber: data.totalFiber || 0,
        photoUrl: data.photoUrl,
        notes: data.notes || '',
      });
    });

    console.log(`✅ Found ${meals.length} recent meals`);
    return meals;
  } catch (error) {
    console.error('❌ Error finding recent meals:', error);
    throw error;
  }
};

/**
 * Get daily summary (total calories and all meals for a date)
 * @param {string} userId - The user's ID
 * @param {Date} date - The date to get summary for
 * @param {number} calorieTarget - User's daily calorie target
 * @returns {Promise<Object>} Daily summary with totals and meals
 */
export const getDailySummary = async (userId, date, calorieTarget = 2400) => {
  try {
    console.log('📊 Getting daily summary for:', date.toDateString());

    const meals = await getMeals(userId, date);

    const totals = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fats: acc.fats + meal.totalFats,
      fiber: acc.fiber + meal.totalFiber,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 });

    const summary = {
      date: date.toISOString().split('T')[0], // "2025-11-05"
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats,
      totalFiber: totals.fiber,
      calorieTarget,
      progress: Math.min(totals.calories / calorieTarget, 1.0), // 0.0 to 1.0
      mealsCount: meals.length,
      meals,
    };

    console.log('✅ Daily summary:', {
      calories: `${totals.calories} / ${calorieTarget}`,
      progress: `${(summary.progress * 100).toFixed(0)}%`,
      meals: meals.length,
    });

    return summary;
  } catch (error) {
    console.error('❌ Error getting daily summary:', error);
    throw error;
  }
};
