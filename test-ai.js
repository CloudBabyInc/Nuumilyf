/**
 * Command-line script to test the AI Meal Planner
 */

// Import required modules
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ntyrjdiwsdccayaiwbmd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '0e5ahwrl54ofU9CC5T5n2uCiRIfWNzpo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple test function to check if the AI responds
const testAIResponse = async () => {
  console.log('🧪 Testing AI Meal Planner response...');

  try {
    // Call the test AI response Edge Function with a simple greeting
    const { data, error } = await supabase.functions.invoke('test-ai-response', {
      method: 'POST',
      body: {
        message: 'Hi there! Can you help me plan a meal?'
      },
    });

    if (error) {
      console.error('❌ Error calling AI Meal Planner:', error);
      return false;
    }

    // Check if we got a response
    if (data) {
      console.log('✅ AI Meal Planner responded!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('❌ No response from AI Meal Planner');
      return false;
    }
  } catch (error) {
    console.error('❌ Exception when testing AI Meal Planner:', error);
    return false;
  }
};

// Run the test
testAIResponse()
  .then(success => {
    if (success) {
      console.log('🎉 Test completed successfully!');
      process.exit(0);
    } else {
      console.log('😞 Test failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error during test:', error);
    process.exit(1);
  });
