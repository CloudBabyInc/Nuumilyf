/**
 * Service for interacting with AI meal planning functionality
 * Direct implementation using Mistral API without Python backend or Edge Functions
 */

import { supabase } from '@/integrations/supabase/client';
import { generateMealPlan as mistralGenerateMealPlan } from './mistralDirectService';
import { zimbabweFoods, filterFoodItems } from '@/data/zimbabweFoods';

/**
 * Generate a meal plan using the Mistral AI model directly
 * @param {Object} preferences - User preferences for the meal plan
 * @returns {Promise<Object>} Generated meal plan
 */
export const generateAIMealPlan = async (preferences) => {
  try {
    console.log('Generating meal plan with preferences:', preferences);

    // Validate and enhance all preferences
    // 1. Target User
    if (!preferences.targetUser) {
      console.warn('Missing targetUser in preferences, defaulting to "mother"');
      preferences.targetUser = 'mother';
    }

    // 2. Meal Type
    if (!preferences.mealType) {
      console.warn('Missing mealType in preferences, defaulting to "breakfast"');
      preferences.mealType = 'breakfast';
    }

    // 3. Child Age (if applicable)
    if (preferences.targetUser === 'child') {
      if (!preferences.childAge || typeof preferences.childAge !== 'number') {
        console.warn('Invalid childAge in preferences, defaulting to 12 months');
        preferences.childAge = 12;
      }

      // Add explicit note about age being in months
      preferences.childAgeNote = `${preferences.childAge} months old`;
      console.log(`Child age: ${preferences.childAge} months`);
    }

    // 4. Dietary Restrictions
    if (!preferences.dietaryRestrictions || !Array.isArray(preferences.dietaryRestrictions)) {
      console.warn('Invalid dietaryRestrictions in preferences, defaulting to empty array');
      preferences.dietaryRestrictions = [];
    }

    // 5. Nutrition Goals
    if (!preferences.nutritionGoals || typeof preferences.nutritionGoals !== 'object') {
      console.warn('Invalid nutritionGoals in preferences, defaulting to balanced');
      preferences.nutritionGoals = { focus: 'balanced' };
    } else if (!preferences.nutritionGoals.focus) {
      console.warn('Missing nutritionGoals.focus in preferences, defaulting to balanced');
      preferences.nutritionGoals.focus = 'balanced';
    }

    // 6. Traditional Food Preference
    if (typeof preferences.preferTraditional !== 'boolean') {
      console.warn('Invalid preferTraditional in preferences, defaulting to true');
      preferences.preferTraditional = true;
    }

    // Log the complete, validated preferences
    console.log('Validated preferences:', JSON.stringify(preferences, null, 2));

    // Filter food items based on preferences
    const relevantFoodItems = filterFoodItems(preferences);
    console.log(`Found ${relevantFoodItems.length} relevant food items for ${preferences.targetUser} and meal type ${preferences.mealType}`);

    // Check if we have enough food items
    if (relevantFoodItems.length === 0) {
      console.warn('No relevant food items found, using all food items instead');
      // If no relevant food items, use all food items
      relevantFoodItems.push(...zimbabweFoods.slice(0, 50));
    }

    // Generate meal plan using Mistral API directly
    console.log('Calling Mistral API to generate meal plan...');
    const mealPlan = await mistralGenerateMealPlan(preferences, relevantFoodItems);

    // Validate the meal plan structure
    if (!mealPlan || !mealPlan.meals || !Array.isArray(mealPlan.meals)) {
      throw new Error('Invalid meal plan structure received from API');
    }

    // Ensure all meals have the required properties
    mealPlan.meals.forEach(meal => {
      if (!meal.name || !meal.ingredients || !meal.instructions || !meal.nutrients) {
        throw new Error('Invalid meal data: missing required properties');
      }

      // Ensure nutrients are integers
      if (meal.nutrients) {
        meal.nutrients.calories = Math.round(Number(meal.nutrients.calories) || 0);
        meal.nutrients.protein = Math.round(Number(meal.nutrients.protein) || 0);
        meal.nutrients.carbs = Math.round(Number(meal.nutrients.carbs) || 0);
        meal.nutrients.fat = Math.round(Number(meal.nutrients.fat) || 0);
      }
    });

    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }
};

/**
 * Save a generated meal plan to the database
 * @param {Object} mealPlan - The generated meal plan
 * @param {Object} options - Additional options (userId, targetUser, mealType)
 * @returns {Promise<Object>} Result of the save operation
 */
export const saveMealPlan = async (mealPlan, { userId, targetUser, mealType }) => {
  try {
    // Save directly to Supabase
    const { data, error } = await supabase
      .from('ai_meal_plans')
      .insert({
        user_id: userId,
        plan_data: mealPlan,
        target_user: targetUser,
        meal_type: mealType,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

/**
 * Get all saved meal plans for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of meal plans
 */
export const getUserMealPlans = async (userId) => {
  try {
    // Get directly from Supabase
    const { data, error } = await supabase
      .from('ai_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    throw error;
  }
};

/**
 * Delete a meal plan
 * @param {string} planId - The ID of the meal plan to delete
 * @returns {Promise<Object>} Result of the delete operation
 */
export const deleteMealPlan = async (planId) => {
  try {
    // Delete directly from Supabase
    const { error } = await supabase
      .from('ai_meal_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    throw error;
  }
};
