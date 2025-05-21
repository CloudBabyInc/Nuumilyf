// Test script to verify Supabase connection
import { supabase } from './src/integrations/supabase/client.js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test database connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Data:', data);
    
    return true;
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return false;
  }
}

testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('Supabase connection test passed!');
    } else {
      console.error('Supabase connection test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });
