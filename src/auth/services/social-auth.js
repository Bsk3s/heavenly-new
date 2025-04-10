// src/auth/services/social-auth.js
// Service for handling social authentication (Google, Apple)

import { signInWithOAuth } from './auth-service';
import { supabase } from '../supabase-client';

/**
 * Sign in with Google using Supabase OAuth
 */
export async function signInWithGoogle() {
  try {
    return await signInWithOAuth('google');
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Sign in with Apple using Supabase OAuth
 */
export async function signInWithApple() {
  try {
    return await signInWithOAuth('apple');
  } catch (error) {
    console.error('Apple sign-in error:', error);
    throw error;
  }
}

/**
 * Handle the OAuth redirect/callback
 * This would typically be called from your deep link handler
 */
export async function handleAuthCallback(url) {
  console.log('📲 Auth callback received URL:', url);
  
  // Extract the token from the URL
  try {
    // Log URL components for debugging
    if (url) {
      console.log('🔍 Parsing URL components...');
      
      // Extract hash fragment (everything after #)
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        console.log('# Found hash fragment in URL');
        const hashFragment = url.substring(hashIndex + 1);
        const params = new URLSearchParams(hashFragment);
        
        // Check for access_token in hash fragment
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const expiresIn = params.get('expires_in');
        const tokenType = params.get('token_type');
        
        console.log('🔑 Access token present:', !!accessToken);
        console.log('🔄 Refresh token present:', !!refreshToken);
        
        if (accessToken) {
          console.log('✅ Found access_token in hash fragment, setting session manually');
          try {
            // Try to set the session manually using the extracted tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('❌ Error setting session:', error);
              throw error;
            }
            
            console.log('✅ Session set successfully, user:', data?.user?.email);
            return { success: true, session: data.session, user: data.user };
          } catch (sessionError) {
            console.error('❌ Error setting session manually:', sessionError);
            // Try getting current session as fallback
            const { data: currentData } = await supabase.auth.getSession();
            if (currentData?.session) {
              console.log('✅ Fallback: current session exists');
              return { success: true, session: currentData.session, user: currentData.session.user };
            }
            throw sessionError;
          }
        }
      }
      
      // If no hash fragment with token, check for code parameter (original flow)
      const urlObj = new URL(url);
      console.log('URL protocol:', urlObj.protocol);
      console.log('URL host:', urlObj.host);
      console.log('URL pathname:', urlObj.pathname);
      console.log('URL search params:', urlObj.search);
      
      // Extract any potential code
      const code = urlObj.searchParams.get('code');
      console.log('URL has code:', !!code);
      
      if (code) {
        console.log('🔑 Code found in URL, exchanging for session');
        try {
          const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (codeError) {
            console.error('❌ Code exchange error:', codeError);
            throw codeError;
          }
          
          console.log('✅ Code exchange successful, user:', codeData.user?.email);
          return { success: true, session: codeData.session, user: codeData.user };
        } catch (codeExchangeError) {
          console.error('❌ Error exchanging code:', codeExchangeError);
          
          // If that fails, let the auth listener handle it
          console.log('🔄 Falling back to auth state listener for session update');
          // Get current session instead
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          
          return { success: !!data.session, session: data.session, user: data.session?.user }; 
        }
      } else {
        // If no code in URL or hash token, check if session is already updated by auth state change
        console.log('⚠️ No code or access_token found in URL, checking current session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          throw error;
        }
        
        console.log('✅ Session check result:', data.session ? 'Session exists' : 'No session');
        return { 
          success: !!data.session, 
          session: data.session, 
          user: data.session?.user 
        };
      }
    }
    
    console.log('❓ URL is not an auth callback URL or is invalid');
    return { success: false, error: 'Not a valid auth callback URL' };
  } catch (parseError) {
    console.error('❌ Error parsing URL:', parseError);
    return { success: false, error: parseError };
  }
} 