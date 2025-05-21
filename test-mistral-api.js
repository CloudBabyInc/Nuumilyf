/**
 * CLI Test Module for Mistral API Integration
 *
 * This script tests the Mistral API integration for meal planning
 * without requiring the full UI to be running.
 *
 * Usage:
 *   node test-mistral-api.js
 */

import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '.env') });

// Get API key from environment variables
const MISTRAL_API_KEY = process.env.VITE_MISTRAL_API_KEY || 'OFYOe2jjcmu7wRhr2g8irlY927YlBLsj';
const MISTRAL_MODEL = 'mistral-large-latest';

// Create Mistral client
const mistralClient = new Mistral({
  apiKey: MISTRAL_API_KEY
});

// Sample food items for testing
const sampleFoodItems = [
  {
    name: 'Sadza',
    description: 'Traditional Zimbabwean staple food made from maize meal',
    nutrients: { calories: 250, protein: 5, carbs: 50, fat: 1 },
    suitable_for: ['mother', 'child'],
    meal_type: ['lunch', 'dinner'],
    traditional: true
  },
  {
    name: 'Muriwo une Dovi',
    description: 'Leafy greens cooked with peanut butter',
    nutrients: { calories: 180, protein: 8, carbs: 15, fat: 12 },
    suitable_for: ['mother', 'child'],
    meal_type: ['lunch', 'dinner'],
    traditional: true
  },
  {
    name: 'Mapopo',
    description: 'Sweet papaya',
    nutrients: { calories: 120, protein: 2, carbs: 30, fat: 0 },
    suitable_for: ['mother', 'child'],
    meal_type: ['breakfast', 'snack'],
    traditional: true
  },
  {
    name: 'Porridge',
    description: 'Maize meal porridge',
    nutrients: { calories: 150, protein: 3, carbs: 30, fat: 1 },
    suitable_for: ['mother', 'child'],
    meal_type: ['breakfast'],
    traditional: true
  },
  {
    name: 'Madora',
    description: 'Dried mopane worms, high in protein',
    nutrients: { calories: 200, protein: 35, carbs: 5, fat: 8 },
    suitable_for: ['mother'],
    meal_type: ['lunch', 'dinner'],
    traditional: true
  }
];

// Sample user preferences
const samplePreferences = {
  targetUser: 'mother',
  childAge: 0, // Not applicable for mother
  mealType: 'breakfast',
  dietaryRestrictions: [],
  nutritionGoals: {
    focus: 'balanced'
  },
  preferTraditional: true
};

/**
 * Test the Mistral API by generating a meal plan
 */
async function testMistralAPI() {
  try {
    console.log('Testing Mistral API integration...');
    console.log(`API Key: ${MISTRAL_API_KEY.substring(0, 5)}...`);
    console.log(`Model: ${MISTRAL_MODEL}`);

    // Filter food items based on preferences
    const relevantFoodItems = sampleFoodItems.filter(item =>
      item.meal_type.includes(samplePreferences.mealType) &&
      item.suitable_for.includes(samplePreferences.targetUser)
    );

    console.log(`Found ${relevantFoodItems.length} relevant food items for ${samplePreferences.targetUser} and meal type ${samplePreferences.mealType}`);

    // Construct prompt for Mistral
    const systemPrompt = `You are a nutritional expert specializing in meal planning for mothers and children in Zimbabwe.
    Your task is to create a personalized meal plan based on the user's preferences and the available food items.
    The meal plan should be nutritionally balanced, culturally appropriate, and tailored to the specific needs of the target user.

    Available food items:
    ${JSON.stringify(relevantFoodItems, null, 2)}

    User preferences:
    ${JSON.stringify(samplePreferences, null, 2)}

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

    console.log('Sending request to Mistral API...');

    // Call Mistral API
    const response = await mistralClient.chat.complete({
      model: MISTRAL_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please generate a meal plan based on my preferences." }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    console.log('Response received from Mistral API!');
    console.log(`Status: ${response ? 'Success' : 'Failed'}`);

    if (response && response.choices && response.choices.length > 0) {
      console.log(`Response contains ${response.choices.length} choices`);

      // Parse the meal plan
      const mealPlanContent = response.choices[0].message.content;
      console.log('\nRaw response content:');
      console.log(mealPlanContent.substring(0, 300) + '...');

      try {
        // Try to parse the JSON directly
        let mealPlan;
        try {
          mealPlan = JSON.parse(mealPlanContent);
        } catch (directParseError) {
          // If direct parsing fails, try to extract JSON from markdown code blocks
          console.log('Direct JSON parsing failed, trying to extract from markdown...');
          const jsonMatch = mealPlanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            console.log('Found JSON in code block, attempting to parse');
            mealPlan = JSON.parse(jsonMatch[1]);
          } else {
            throw directParseError;
          }
        }

        console.log('\nParsed meal plan:');
        console.log('Introduction:', mealPlan.introduction);
        console.log('Number of meals:', mealPlan.meals.length);
        console.log('First meal:', mealPlan.meals[0].name);
        console.log('Tips:', mealPlan.tips.length);

        console.log('\nTest completed successfully!');
      } catch (parseError) {
        console.error('Error parsing meal plan JSON:', parseError);
        console.log('Raw meal plan content:', mealPlanContent);
      }
    } else {
      console.error('Invalid response format:', response);
    }
  } catch (error) {
    console.error('Error testing Mistral API:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testMistralAPI();
