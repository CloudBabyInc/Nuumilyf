# Direct Mistral AI Integration for Meal Planning

This document explains how to set up and use the direct Mistral AI integration for the meal planning feature.

## Overview

The meal planning feature now uses a direct integration with the Mistral AI API (specifically the Mistral Large model), eliminating the need for a Python backend or Supabase Edge Functions. This simplifies the architecture and makes it easier to deploy and maintain.

### Why Mistral Large?

We've chosen to use the Mistral Large model for meal planning because:

1. It has excellent nutritional knowledge and understanding of food
2. It can generate culturally appropriate meal plans for Zimbabwean cuisine
3. It provides detailed nutritional information and preparation instructions
4. It can tailor recommendations based on specific dietary needs and preferences

## Setup Instructions

1. **Get a Mistral API Key**
   - Sign up at [Mistral AI Console](https://console.mistral.ai/)
   - Create an API key in your account settings

2. **Set Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Mistral API key to the `.env` file:
     ```
     VITE_MISTRAL_API_KEY=your_mistral_api_key_here
     ```

3. **Install Dependencies**
   - Make sure axios is installed:
     ```
     npm install axios
     ```

## How It Works

The implementation consists of three main components:

1. **mistralDirectService.js**
   - Handles direct communication with the Mistral AI API
   - Formats prompts and parses responses
   - Provides fallback responses in case of errors

2. **zimbabweFoods.js**
   - Contains local data for Zimbabwean foods
   - Provides filtering functions based on user preferences
   - Eliminates the need for a database table

3. **aiMealService.js**
   - Main service used by the UI components
   - Coordinates between the data and the AI service
   - Handles saving and retrieving meal plans from Supabase

## Food Data

The food data has been extracted from the Zimbabwe Food Composition Table and converted to a format suitable for the meal planner. The data includes:

- Over 130 traditional Zimbabwean foods
- Detailed nutritional information (calories, protein, carbs, fat)
- Categorization by meal type (breakfast, lunch, dinner, snack)
- Suitability for different users (mother, child)
- Descriptions highlighting nutritional benefits

To add or modify the food data:

1. Edit the `src/data/zimbabweFoods.js` file
2. Add new food items following the existing structure:
   ```javascript
   {
     id: 'unique_id',
     name: 'Food Name',
     description: 'Description of the food',
     nutrients: {
       calories: 300,
       protein: 10,
       carbs: 45,
       fat: 5
     },
     suitable_for: ['mother', 'child'],
     meal_type: ['breakfast', 'lunch', 'dinner', 'snack'],
     traditional: true
   }
   ```

## Customizing the AI Prompts

To modify how the AI generates meal plans:

1. Edit the `systemPrompt` in the `generateMealPlan` function in `mistralDirectService.js`
2. Adjust the instructions and output format as needed
3. Test thoroughly to ensure the AI generates appropriate responses

## Troubleshooting

If you encounter issues:

1. **API Key Issues**
   - Verify your Mistral API key is correct
   - Check that the environment variable is properly loaded

2. **Response Format Issues**
   - The AI might occasionally return malformed JSON
   - The service includes error handling and fallbacks

3. **Rate Limiting**
   - Mistral API has rate limits
   - Consider implementing caching for frequent requests

## Future Improvements

Potential enhancements for the future:

1. Implement caching to reduce API calls and improve performance
2. Add more customization options for meal plans (e.g., calorie targets, specific nutrient goals)
3. Improve error handling and fallback mechanisms
4. Add image generation for meals using an image API
5. Implement user feedback system to improve meal recommendations over time
6. Add seasonal food availability information
7. Include cooking time and difficulty level for meal preparations
