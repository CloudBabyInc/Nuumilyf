/**
 * Simple test script for the AI Meal Planner
 * This script tests if the AI responds to a basic greeting
 */

import { supabase } from '../integrations/supabase/client';

// Simple test function to check if the AI responds
const testAIResponse = async () => {
  console.log('🧪 Testing AI Meal Planner response...');
  
  try {
    // Call the AI meal planner Edge Function with a simple greeting
    const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
      method: 'POST',
      body: { 
        message: 'Hi there! Can you help me plan a meal?',
        test: true
      },
    });
    
    if (error) {
      console.error('❌ Error calling AI Meal Planner:', error);
      return false;
    }
    
    // Check if we got a response
    if (data && data.response) {
      console.log('✅ AI Meal Planner responded!');
      console.log('Response:', data.response);
      return true;
    } else {
      console.log('❌ No response from AI Meal Planner');
      console.log('Received data:', data);
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
    } else {
      console.log('😞 Test failed.');
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error during test:', error);
  });

// Export the test function for use in other tests
export default testAIResponse;
