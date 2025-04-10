// src/auth/supabase-client.js
// Singleton pattern for Supabase client to ensure we only initialize it once

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the Supabase client with AsyncStorage for React Native
let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase URL and anon key are required. Check your .env file.'
    );
  }

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseInstance;
}

// Export a singleton instance
export const supabase = getSupabaseClient();

// Export helper hook for use in components
export function useSupabase() {
  return supabase;
} 