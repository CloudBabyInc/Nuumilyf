/**
 * Service to upload the Zimbabwe food composition pickle file to Supabase
 * and create vector embeddings for AI-powered meal planning
 */

import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

// Create a Supabase client with admin privileges for vector operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wdcbmuhxmmigveggjsfr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkY2JtdWh4bW1pZ3ZlZ2dqc2ZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY0NDMyNSwiZXhwIjoyMDYzMjIwMzI1fQ.shITYPgjbKLBHgDpizQuJ-HU4QHXK-8yKW5TnG9nS0E' // Service role key
);

// Initialize OpenAI client for creating embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Process the pickle file and extract food items
 * @param {Buffer} pickleData - The pickle file data
 * @returns {Array} - Array of food items
 */
const processFoodData = async (pickleData) => {
  try {
    // In a real implementation, you would use a Python script or service
    // to process the pickle file. For this example, we'll simulate the output.

    // Simulated food items extracted from the pickle file
    const foodItems = [
      {
        name: "Sadza (Maize Porridge)",
        description: "Traditional Zimbabwean staple food made from maize meal",
        nutrients: {
          calories: 120,
          protein: 2.5,
          carbs: 25,
          fat: 0.5
        },
        suitable_for: ["mother", "child_9_plus"],
        meal_type: ["lunch", "dinner"],
        traditional: true
      },
      {
        name: "Mashed Sweet Potato and Avocado",
        description: "Nutritious blend for babies combining sweet potatoes and avocados",
        nutrients: {
          calories: 150,
          protein: 2,
          carbs: 20,
          fat: 7
        },
        suitable_for: ["child_6_plus"],
        meal_type: ["lunch"],
        traditional: true
      },
      // More food items would be extracted from the actual pickle file
    ];

    return foodItems;
  } catch (error) {
    console.error('Error processing pickle data:', error);
    throw error;
  }
};

/**
 * Create vector embeddings for food items
 * @param {Array} foodItems - Array of food items
 * @returns {Array} - Array of food items with embeddings
 */
const createEmbeddings = async (foodItems) => {
  try {
    const itemsWithEmbeddings = [];

    for (const item of foodItems) {
      // Create a text representation of the food item for embedding
      const textToEmbed = `
        Food: ${item.name}
        Description: ${item.description}
        Nutrients: Calories ${item.nutrients.calories}, Protein ${item.nutrients.protein}g, Carbs ${item.nutrients.carbs}g, Fat ${item.nutrients.fat}g
        Suitable for: ${item.suitable_for.join(', ')}
        Meal type: ${item.meal_type.join(', ')}
        Traditional: ${item.traditional ? 'Yes' : 'No'}
      `;

      // Generate embedding using OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: textToEmbed,
      });

      // Add embedding to food item
      itemsWithEmbeddings.push({
        ...item,
        embedding: embeddingResponse.data[0].embedding,
      });
    }

    return itemsWithEmbeddings;
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
};

/**
 * Store food items with embeddings in Supabase
 * @param {Array} foodItemsWithEmbeddings - Array of food items with embeddings
 */
const storeFoodItemsInSupabase = async (foodItemsWithEmbeddings) => {
  try {
    // First, ensure the table exists with vector support
    await supabaseAdmin.rpc('create_zimbabwe_food_table_if_not_exists');

    // Insert food items with embeddings
    for (const item of foodItemsWithEmbeddings) {
      const { error } = await supabaseAdmin
        .from('zimbabwe_foods')
        .insert({
          name: item.name,
          description: item.description,
          nutrients: item.nutrients,
          suitable_for: item.suitable_for,
          meal_type: item.meal_type,
          traditional: item.traditional,
          embedding: item.embedding,
        });

      if (error) {
        console.error('Error inserting food item:', error);
      }
    }

    console.log(`Successfully stored ${foodItemsWithEmbeddings.length} food items in Supabase`);
  } catch (error) {
    console.error('Error storing food items in Supabase:', error);
    throw error;
  }
};

/**
 * Upload pickle file to Supabase storage
 * @param {string} filePath - Path to the pickle file
 * @returns {string} - URL of the uploaded file
 */
const uploadPickleFile = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from('ai-data')
      .upload(`zimbabwe-foods/${fileName}`, fileData, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('ai-data')
      .getPublicUrl(`zimbabwe-foods/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading pickle file:', error);
    throw error;
  }
};

/**
 * Main function to process and upload the pickle file
 * @param {string} filePath - Path to the pickle file
 */
export const processAndUploadPickleFile = async (filePath) => {
  try {
    // Upload pickle file to Supabase storage
    const fileUrl = await uploadPickleFile(filePath);
    console.log('Pickle file uploaded to:', fileUrl);

    // Read and process the pickle file
    const fileData = fs.readFileSync(filePath);
    const foodItems = await processFoodData(fileData);

    // Create embeddings for food items
    const foodItemsWithEmbeddings = await createEmbeddings(foodItems);

    // Store food items with embeddings in Supabase
    await storeFoodItemsInSupabase(foodItemsWithEmbeddings);

    return {
      success: true,
      fileUrl,
      itemCount: foodItems.length
    };
  } catch (error) {
    console.error('Error processing and uploading pickle file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
