// src/auth/services/auth-service.js
// Service for handling authentication operations with Supabase

import { supabase } from '../supabase-client';

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'heavenlyhub://auth/callback',
      },
    });
    
    if (error) throw error;
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
}

/**
 * Sign in with OAuth provider (Google, Apple, etc.)
 */
export async function signInWithOAuth(provider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'heavenlyhub://auth/callback',
      },
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error signing in with ${provider}:`, error.message);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

/**
 * Reset password for a user
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'heavenlyhub://auth/reset-password-confirmation',
    });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error resetting password:', error.message);
    throw error;
  }
}

/**
 * Get current user and session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting session:', error.message);
    return { session: null };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
}

/**
 * Test function to verify authentication flow
 * Useful for testing without modifying the UI
 */
export async function testEmailAuth(email, password) {
  console.log('Testing email authentication flow...');
  
  try {
    // Try signing up first
    console.log('1. Attempting to sign up with:', email);
    const signUpResult = await signUpWithEmail(email, password);
    console.log('Sign-up result:', !!signUpResult?.user ? 'Success' : 'Failed', 
      signUpResult?.user ? '(User created)' : '(No user returned)');
    
    // Try signing in
    console.log('2. Attempting to sign in with:', email);
    const signInResult = await signInWithEmail(email, password);
    console.log('Sign-in result:', !!signInResult?.user ? 'Success' : 'Failed');
    
    // Get current user
    console.log('3. Checking current user');
    const currentUser = await getCurrentUser();
    console.log('Current user:', currentUser ? `Found (${currentUser.email})` : 'Not found');
    
    return {
      signUpResult,
      signInResult,
      currentUser
    };
  } catch (error) {
    console.error('Authentication test failed:', error.message);
    throw error;
  }
} 