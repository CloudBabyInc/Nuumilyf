/**
 * Direct service for interacting with Mistral AI API
 * This service bypasses the need for Python backend or Edge Functions
 */

// Import the Mistral client
import { Mistral } from '@mistralai/mistralai';

// Mistral API configuration
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || 'OFYOe2jjcmu7wRhr2g8irlY927YlBLsj'; // Fallback to hardcoded key if env var not available
const MISTRAL_MODEL = 'mistral-large-latest'; // Using Mistral Large for better nutritional knowledge and meal planning

// Create Mistral client
const mistralClient = new Mistral({
  apiKey: MISTRAL_API_KEY
});

// Debug: Log API configuration on module load
console.log('Mistral API configuration:');
console.log(`- API Key: ${MISTRAL_API_KEY ? MISTRAL_API_KEY.substring(0, 5) + '...' : 'Not set'}`);
console.log(`- Model: ${MISTRAL_MODEL}`);
console.log('- Using official Mistral client library');

/**
 * Make a call to the Mistral API using the official client
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} - The API response
 */
const callMistralAPI = async (messages, options = {}) => {
  try {
    // Debug: Log API key (first few characters only for security)
    const apiKeyPreview = MISTRAL_API_KEY ? `${MISTRAL_API_KEY.substring(0, 5)}...` : 'undefined';
    console.log(`Using Mistral API key: ${apiKeyPreview}`);
    console.log(`Using Mistral model: ${options.model || MISTRAL_MODEL}`);

    // Debug: Log request payload size
    console.log(`Request contains ${messages.length} messages`);
    console.log(`System prompt length: ${messages[0]?.content?.length || 0} characters`);

    // Call Mistral API using the official client
    const response = await mistralClient.chat.complete({
      model: options.model || MISTRAL_MODEL,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      response_format: { type: 'json_object' }
    });

    // Debug: Log response
    console.log(`Mistral API response received successfully`);
    console.log(`Response contains ${response.choices.length} choices`);

    return response;
  } catch (error) {
    // Enhanced error logging
    console.error('Error calling Mistral API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Mistral API error: ${error.message}`);
  }
};

/**
 * Generate a meal plan using Mistral AI
 * @param {Object} preferences - User preferences
 * @param {Array} foodItems - Available food items
 * @returns {Promise<Object>} - Generated meal plan
 */
export const generateMealPlan = async (preferences, foodItems) => {
  try {
    console.log(`Generating meal plan with ${foodItems.length} food items`);

    // Limit the number of food items to prevent payload size issues
    // Only include items that match the meal type and target user
    const filteredItems = foodItems.filter(item =>
      item.meal_type.includes(preferences.mealType) &&
      item.suitable_for.includes(preferences.targetUser)
    );

    console.log(`Filtered to ${filteredItems.length} relevant food items`);

    // If still too many, limit to a reasonable number
    const limitedItems = filteredItems.length > 50 ? filteredItems.slice(0, 50) : filteredItems;

    console.log(`Using ${limitedItems.length} food items in the prompt`);

    // Prepare food items data for Mistral
    const foodItemsData = limitedItems.map(item => ({
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

    CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
    1. Target User:
       - For MOTHER: Focus on maternal nutrition needs, including energy, protein, iron, calcium, and folate.
       - For CHILD: The childAge is specified in MONTHS, not years (e.g., 11 means 11 MONTHS old).
       - For infants under 12 months: Recommend soft, easily digestible foods appropriate for their developmental stage.
       - For toddlers (12-36 months): Recommend nutrient-dense finger foods and small meals.

    2. Meal Type:
       - BREAKFAST: Focus on energy-providing foods to start the day.
       - LUNCH: Provide balanced meals with protein, carbohydrates, and vegetables.
       - DINNER: Offer nutritious but lighter options for the evening.
       - SNACK: Suggest healthy, convenient options between main meals.

    3. Dietary Restrictions:
       - Strictly avoid any ingredients listed in the dietaryRestrictions array.
       - If no restrictions are specified, you may use any suitable ingredients.

    4. Nutrition Goals:
       - BALANCED: Provide well-rounded nutrition with a mix of all macronutrients.
       - PROTEIN: Emphasize high-protein foods for muscle development and repair.
       - IRON: Focus on iron-rich foods to prevent anemia.
       - CALCIUM: Prioritize calcium sources for bone health.
       - ENERGY: Suggest calorie-dense foods for increased energy needs.

    5. Traditional Foods:
       - If preferTraditional is TRUE: Prioritize traditional Zimbabwean foods.
       - Ensure cultural appropriateness of all recommendations.

    Available food items:
    ${JSON.stringify(foodItemsData, null, 2)}

    User preferences:
    ${JSON.stringify(preferences, null, 2)}

    Please generate a meal plan with the following structure:
    1. A brief introduction explaining the benefits of the meal plan (mention ALL relevant preferences)
    2. A list of meals for the specified meal type (breakfast, lunch, dinner, or snack)
    3. For each meal, include:
       - Name
       - Ingredients
       - Preparation instructions
       - Nutritional information
       - Benefits for the target user (explicitly address ALL relevant preferences)
    4. Tips for preparation and storage

    Return the meal plan as a JSON object with the following structure:
    {
      "introduction": "string",
      "meals": [
        {
          "name": "string",
          "ingredients": ["string"],
          "instructions": ["string"],
          "nutrients": {
            "calories": integer (MUST be a whole number, no decimals),
            "protein": integer (MUST be a whole number, no decimals),
            "carbs": integer (MUST be a whole number, no decimals),
            "fat": integer (MUST be a whole number, no decimals)
          },
          "benefits": "string",
          "emojis": ["string", "string", "string"] // IMPORTANT: Array of 2-4 food emojis that ACCURATELY represent the main ingredients in this meal
        }
      ],
      "tips": ["string"]
    }

    CRITICAL INSTRUCTIONS FOR EMOJI SELECTION:
    1. For the "emojis" field, select ONLY food-related emojis that directly represent the main ingredients in the meal
    2. NEVER include non-food emojis like magnifying glass (🔍), document (📄), ruler (📐), or other unrelated symbols
    3. For each meal, include 2-4 emojis that best represent the main ingredients
    4. For example:
       - For "Oatmeal with Banana and Raisins": use ["🥣", "🍌", "🍇"]
       - For "Sadza with Boiled Sweet Potatoes and Avocado": use ["🌽", "🍠", "🥑"]
       - For "Millet and Vegetable Porridge": use ["🌾", "🥕", "🥣"]
    5. Be precise and accurate - the emojis should clearly represent the actual ingredients`;

    // Call Mistral API
    const response = await callMistralAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Please generate a meal plan based on my preferences." }
    ]);

    // Parse and return the meal plan
    const mealPlanContent = response.choices[0].message.content;
    console.log('Received meal plan content:', mealPlanContent.substring(0, 100) + '...');

    // Try to parse the JSON directly first
    try {
      const mealPlanData = JSON.parse(mealPlanContent);

      // Ensure all nutritional values are integers
      if (mealPlanData.meals && Array.isArray(mealPlanData.meals)) {
        mealPlanData.meals.forEach(meal => {
          if (meal.nutrients) {
            meal.nutrients.calories = Math.round(Number(meal.nutrients.calories) || 0);
            meal.nutrients.protein = Math.round(Number(meal.nutrients.protein) || 0);
            meal.nutrients.carbs = Math.round(Number(meal.nutrients.carbs) || 0);
            meal.nutrients.fat = Math.round(Number(meal.nutrients.fat) || 0);
          }
        });
      }

      return mealPlanData;
    } catch (directParseError) {
      console.log('Direct JSON parsing failed, trying to extract from markdown...');

      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = mealPlanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        console.log('Found JSON in code block, attempting to parse');
        try {
          const mealPlanData = JSON.parse(jsonMatch[1]);

          // Ensure all nutritional values are integers
          if (mealPlanData.meals && Array.isArray(mealPlanData.meals)) {
            mealPlanData.meals.forEach(meal => {
              if (meal.nutrients) {
                meal.nutrients.calories = Math.round(Number(meal.nutrients.calories) || 0);
                meal.nutrients.protein = Math.round(Number(meal.nutrients.protein) || 0);
                meal.nutrients.carbs = Math.round(Number(meal.nutrients.carbs) || 0);
                meal.nutrients.fat = Math.round(Number(meal.nutrients.fat) || 0);
              }
            });
          }

          return mealPlanData;
        } catch (nestedError) {
          console.error('Error parsing extracted JSON:', nestedError);
          console.log('Extracted content:', jsonMatch[1].substring(0, 100) + '...');
          throw new Error('Could not parse meal plan data from code block');
        }
      }

      // If no code block is found, try to extract anything that looks like JSON
      const possibleJsonMatch = mealPlanContent.match(/\{[\s\S]*\}/);
      if (possibleJsonMatch && possibleJsonMatch[0]) {
        console.log('Found possible JSON object, attempting to parse');
        try {
          const mealPlanData = JSON.parse(possibleJsonMatch[0]);

          // Ensure all nutritional values are integers
          if (mealPlanData.meals && Array.isArray(mealPlanData.meals)) {
            mealPlanData.meals.forEach(meal => {
              if (meal.nutrients) {
                meal.nutrients.calories = Math.round(Number(meal.nutrients.calories) || 0);
                meal.nutrients.protein = Math.round(Number(meal.nutrients.protein) || 0);
                meal.nutrients.carbs = Math.round(Number(meal.nutrients.carbs) || 0);
                meal.nutrients.fat = Math.round(Number(meal.nutrients.fat) || 0);
              }
            });
          }

          return mealPlanData;
        } catch (jsonObjectError) {
          console.error('Error parsing possible JSON object:', jsonObjectError);
        }
      }

      console.error('All parsing attempts failed');
      throw new Error('Could not parse meal plan data');
    }
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error(`Failed to generate meal plan: ${error.message}`);
  }
};

/**
 * Get meal recommendations based on specific criteria
 * @param {Object} criteria - Specific criteria for recommendations
 * @param {Array} foodItems - Available food items
 * @returns {Promise<Array>} - Array of meal recommendations
 */
export const getMealRecommendations = async (criteria, foodItems) => {
  try {
    // Prepare food items data for Mistral
    const foodItemsData = foodItems.map(item => ({
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

    CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
    1. Target User:
       - For MOTHER: Focus on maternal nutrition needs, including energy, protein, iron, calcium, and folate.
       - For CHILD: The childAge is specified in MONTHS, not years (e.g., 11 means 11 MONTHS old).
       - For infants under 12 months: Recommend soft, easily digestible foods appropriate for their developmental stage.
       - For toddlers (12-36 months): Recommend nutrient-dense finger foods and small meals.

    2. Meal Type:
       - BREAKFAST: Focus on energy-providing foods to start the day.
       - LUNCH: Provide balanced meals with protein, carbohydrates, and vegetables.
       - DINNER: Offer nutritious but lighter options for the evening.
       - SNACK: Suggest healthy, convenient options between main meals.

    3. Dietary Restrictions:
       - Strictly avoid any ingredients listed in the dietaryRestrictions array.
       - If no restrictions are specified, you may use any suitable ingredients.

    4. Nutrition Goals:
       - BALANCED: Provide well-rounded nutrition with a mix of all macronutrients.
       - PROTEIN: Emphasize high-protein foods for muscle development and repair.
       - IRON: Focus on iron-rich foods to prevent anemia.
       - CALCIUM: Prioritize calcium sources for bone health.
       - ENERGY: Suggest calorie-dense foods for increased energy needs.

    5. Traditional Foods:
       - If preferTraditional is TRUE: Prioritize traditional Zimbabwean foods.
       - Ensure cultural appropriateness of all recommendations.

    Available food items:
    ${JSON.stringify(foodItemsData, null, 2)}

    User criteria:
    ${JSON.stringify(criteria, null, 2)}

    Please recommend 3-5 meals that best match the criteria. For each meal, include:
    - Name
    - Brief description
    - Key nutritional benefits (address specific nutritional goals if specified)
    - Why it's suitable for the target user (explicitly address ALL relevant preferences)
    - An emoji that represents this food

    Return the recommendations as a JSON array with the following structure:
    [
      {
        "name": "string",
        "description": "string",
        "nutritionalBenefits": "string",
        "suitabilityReason": "string",
        "emojis": ["string", "string", "string"] // IMPORTANT: Array of 2-4 food emojis that ACCURATELY represent the main ingredients
      }
    ]

    CRITICAL INSTRUCTIONS FOR EMOJI SELECTION:
    1. For the "emojis" field, select ONLY food-related emojis that directly represent the main ingredients in the meal
    2. NEVER include non-food emojis like magnifying glass (🔍), document (📄), ruler (📐), or other unrelated symbols
    3. For each meal, include 2-4 emojis that best represent the main ingredients
    4. For example:
       - For "Oatmeal with Banana and Raisins": use ["🥣", "🍌", "🍇"]
       - For "Sadza with Boiled Sweet Potatoes and Avocado": use ["🌽", "🍠", "🥑"]
       - For "Millet and Vegetable Porridge": use ["🌾", "🥕", "🥣"]
    5. Be precise and accurate - the emojis should clearly represent the actual ingredients`;

    // Call Mistral API
    const response = await callMistralAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: "Please recommend meals based on my criteria." }
    ], { maxTokens: 2000 });

    // Parse and return the recommendations
    const recommendationsContent = response.choices[0].message.content;
    console.log('Received recommendations content:', recommendationsContent.substring(0, 100) + '...');

    // Try to parse the JSON directly first
    try {
      return JSON.parse(recommendationsContent);
    } catch (directParseError) {
      console.log('Direct JSON parsing failed, trying to extract from markdown...');

      // If direct parsing fails, try to extract JSON from markdown code blocks
      const jsonMatch = recommendationsContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        console.log('Found JSON in code block, attempting to parse');
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (nestedError) {
          console.error('Error parsing extracted JSON:', nestedError);
          console.log('Extracted content:', jsonMatch[1].substring(0, 100) + '...');
          throw new Error('Could not parse recommendations data from code block');
        }
      }

      // If no code block is found, try to extract anything that looks like JSON
      const possibleJsonMatch = recommendationsContent.match(/\[[\s\S]*\]/);
      if (possibleJsonMatch && possibleJsonMatch[0]) {
        console.log('Found possible JSON array, attempting to parse');
        try {
          return JSON.parse(possibleJsonMatch[0]);
        } catch (jsonArrayError) {
          console.error('Error parsing possible JSON array:', jsonArrayError);
        }
      }

      console.error('All parsing attempts failed');
      throw new Error('Could not parse recommendations data');
    }
  } catch (error) {
    console.error('Error getting meal recommendations:', error);
    throw new Error(`Failed to get meal recommendations: ${error.message}`);
  }
};

export default {
  generateMealPlan,
  getMealRecommendations
};
