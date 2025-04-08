
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mbvcczgyqblofbmcdfbj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idmNjemd5cWJsb2ZibWNkZmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NzczNDYsImV4cCI6MjA1ODU1MzM0Nn0.mw3MZvogNxzV-sS3jy96ZZEy9kuVnY1VWEPId86sNQQ";

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: false, // Disable automatic detection of auth redirects
    flowType: 'implicit', // Use implicit flow for simpler auth
    debug: import.meta.env.DEV // Enable debug logs in development
  }
});

// Add a function to check if the auth is working properly
export const checkAuthStatus = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Current auth status:', data?.session ? 'Logged in' : 'Logged out', error);
  return { session: data.session, error };
};

// Helper function to clear local storage session data
export const clearAuthSession = async () => {
  await supabase.auth.signOut({ scope: 'local' });
  return { success: true };
};
