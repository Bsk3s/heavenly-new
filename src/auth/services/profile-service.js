// src/auth/services/profile-service.js
// Service for managing user profiles

import { supabase } from '../supabase-client';

/**
 * Ensure a user profile exists for the given user ID
 * Creates a new profile if one doesn't exist
 */
export async function ensureUserProfile(userId) {
  if (!userId) {
    console.error('Cannot ensure profile for undefined user ID');
    return null;
  }

  try {
    // First, check if a profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (fetchError) throw fetchError;
    
    // If profile exists, return it
    if (existingProfile) {
      return existingProfile;
    }
    
    // If no profile exists, create one
    const { data: newProfile, error: insertError } = await supabase
      .from('user_profiles')
      .insert([
        { 
          id: userId,
          role: 'user', // Default role
          agent: false, // Default agent setting
          speech_time: 0, // Initial speech time
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    return newProfile;
  } catch (error) {
    console.error('Error ensuring user profile:', error.message);
    throw error;
  }
}

/**
 * Get the user profile for the given user ID
 */
export async function getUserProfile(userId) {
  if (!userId) {
    console.error('Cannot get profile for undefined user ID');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    return null;
  }
}

/**
 * Update specific fields of a user profile
 */
export async function updateUserProfile(userId, profileData) {
  if (!userId) {
    console.error('Cannot update profile for undefined user ID');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }
} 