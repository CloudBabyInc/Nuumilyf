/**
 * Service to interact with Mistral-Large for AI-powered meal planning
 */

import { supabase } from '@/integrations/supabase/client';
import MistralClient from '@mistralai/mistralai';

// Initialize Mistral client
const mistralClient = new MistralClient(
  process.env.MISTRAL_API_KEY || '0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo'
);

/**
 * Get relevant food items based on user preferences
 * @param {Object} preferences - User preferences
 * @returns {Array} - Array of relevant food items
 */
export const getRelevantFoodItems = async (preferences) => {
  try {
    const {
      targetUser, // 'mother' or 'child'
      childAge, // in months, if targetUser is 'child'
      mealType, // 'breakfast', 'lunch', 'dinner', 'snack'
      dietaryRestrictions, // array of restrictions
      nutritionGoals, // object with nutrition goals
      preferTraditional // boolean
    } = preferences;
    
    // Construct query based on preferences
    let query = supabase
      .from('zimbabwe_foods')
      .select('*');
    
    // Filter by target user
    if (targetUser === 'child') {
      // Convert child age to appropriate category
      let ageCategory;
      if (childAge < 6) {
        ageCategory = 'child_0_6';
      } else if (childAge < 9) {
        ageCategory = 'child_6_plus';
      } else if (childAge < 12) {
        ageCategory = 'child_9_plus';
      } else {
        ageCategory = 'child_12_plus';
      }
      
      query = query.contains('suitable_for', [ageCategory]);
    } else {
      query = query.contains('suitable_for', ['mother']);
    }
    
    // Filter by meal type
    if (mealType) {
      query = query.contains('meal_type', [mealType]);
    }
    
    // Filter by traditional preference
    if (preferTraditional) {
      query = query.eq('traditional', true);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting relevant food items:', error);
    throw error;
  }
};

/**
 * Generate a meal plan using Mistral-Large
 * @param {Object} preferences - User preferences
 * @returns {Object} - Generated meal plan
 */
export const generateMealPlan = async (preferences) => {
  try {
    // Get relevant food items based on preferences
    const relevantFoodItems = await getRelevantFoodItems(preferences);
    
    // Prepare food items data for Mistral
    const foodItemsData = relevantFoodItems.map(item => ({
      name: item.name,
      description: item.description,
      nutrients: item.nutrients,
      suitable_for: item.suitable_for,
      meal_type: item.meal_type,
      traditional: item.traditional
    }));
    
    // Construct prompt for Mistral
    const systemPrompt = `You are a nutritional expert specializing in meal planning for mothers and children in Zimbabwe. 
    Your task is to create a personalized meal plan based on the user's preferences and the available food items.
    The meal plan should be nutritionally balanced, culturally appropriate, and tailored to the specific needs of the target user.
    
    Available food items:
    ${JSON.stringify(foodItemsData, null, 2)}
    
    User preferences:
    ${JSON.stringify(preferences, null, 2)}
    
    Please generate a meal plan with the following structure:
    1. A brief introduction explaining the benefits of the meal plan
    2. A list of meals for the specified meal type (breakfast, lunch, dinner, or snack)
    3. For each meal, include:
       - Name
       - Ingredients
       - Preparation instructions
       - Nutritional information
       - Benefits for the target user
    4. Tips for preparation and storage
    
    Return the meal plan as a JSON object with the following structure:
    {
      "introduction": "string",
      "meals": [
        {
          "name": "string",
          "ingredients": ["string"],
          "instructions": ["string"],
          "nutrients": { "calories": number, "protein": number, "carbs": number, "fat": number },
          "benefits": "string",
          "imageEmoji": "string" // An emoji that represents this food
        }
      ],
      "tips": ["string"]
    }`;
    
    // Call Mistral API
    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please generate a meal plan based on my preferences." }
      ],
      temperature: 0.7,
      maxTokens: 4000,
      responseFormat: { type: "json_object" }
    });
    
    // Parse and return the meal plan
    const mealPlanContent = response.choices[0].message.content;
    const mealPlan = JSON.parse(mealPlanContent);
    
    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw error;
  }
};

/**
 * Get meal recommendations based on specific criteria
 * @param {Object} criteria - Specific criteria for recommendations
 * @returns {Array} - Array of recommended meals
 */
export const getMealRecommendations = async (criteria) => {
  try {
    const {
      targetUser,
      mealType,
      nutritionFocus, // 'protein', 'iron', 'calcium', etc.
      maxPrepTime, // in minutes
      ingredients // array of preferred ingredients
    } = criteria;
    
    // Get relevant food items
    const relevantFoodItems = await getRelevantFoodItems({
      targetUser,
      mealType,
      preferTraditional: true
    });
    
    // Prepare food items data for Mistral
    const foodItemsData = relevantFoodItems.map(item => ({
      name: item.name,
      description: item.description,
      nutrients: item.nutrients,
      suitable_for: item.suitable_for,
      meal_type: item.meal_type,
      traditional: item.traditional
    }));
    
    // Construct prompt for Mistral
    const systemPrompt = `You are a nutritional expert specializing in meal recommendations for mothers and children in Zimbabwe.
    Your task is to recommend meals based on the user's specific criteria and the available food items.
    
    Available food items:
    ${JSON.stringify(foodItemsData, null, 2)}
    
    User criteria:
    ${JSON.stringify(criteria, null, 2)}
    
    Please recommend 3-5 meals that best match the criteria. For each meal, include:
    - Name
    - Brief description
    - Key nutritional benefits
    - Why it's suitable for the target user
    - An emoji that represents this food
    
    Return the recommendations as a JSON array with the following structure:
    [
      {
        "name": "string",
        "description": "string",
        "nutritionalBenefits": "string",
        "suitabilityReason": "string",
        "imageEmoji": "string"
      }
    ]`;
    
    // Call Mistral API
    const response = await mistralClient.chat({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please recommend meals based on my criteria." }
      ],
      temperature: 0.7,
      maxTokens: 2000,
      responseFormat: { type: "json_object" }
    });
    
    // Parse and return the recommendations
    const recommendationsContent = response.choices[0].message.content;
    const recommendations = JSON.parse(recommendationsContent);
    
    return recommendations;
  } catch (error) {
    console.error('Error getting meal recommendations:', error);
    throw error;
  }
};
