// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MistralAI } from 'https://esm.sh/@mistralai/mistralai@0.0.7'

// Initialize Mistral client
const mistralClient = new MistralAI({
  apiKey: Deno.env.get('MISTRAL_API_KEY') || '0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo',
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 204,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // Parse request body
    const { preferences } = await req.json();
    
    if (!preferences) {
      throw new Error('Missing preferences in request body');
    }
    
    const {
      targetUser, // 'mother' or 'child'
      childAge, // in months, if targetUser is 'child'
      mealType, // 'breakfast', 'lunch', 'dinner', 'snack'
      dietaryRestrictions, // array of restrictions
      nutritionGoals, // object with nutrition goals
      preferTraditional // boolean
    } = preferences;
    
    // Get relevant food items from Supabase
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
    const { data: foodItems, error } = await query;
    
    if (error) {
      throw error;
    }
    
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
    
    // Return the meal plan
    return new Response(JSON.stringify({ mealPlan }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500,
    });
  }
});
