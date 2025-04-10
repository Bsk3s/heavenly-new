import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import WebBrowser properly
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Linking, Platform } from 'react-native';

// Import Supabase client and services
import { supabase } from './supabase-client';
import { signInWithEmail, signUpWithEmail, signOut as supabaseSignOut, resetPassword as supabaseResetPassword } from './services/auth-service';
import { signInWithGoogle as supabaseSignInWithGoogle, signInWithApple as supabaseSignInWithApple, handleAuthCallback } from './services/social-auth';
import { ensureUserProfile } from './services/profile-service';

// Create a context for authentication
const AuthContext = createContext(null);

// AuthProvider component to wrap your app
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear any auth errors
  const clearError = () => setError(null);

  // Helper function to log auth state to console
  const logAuthState = async (label) => {
    console.log(`📊 AUTH STATE [${label}]:`);
    console.log(`🔑 User state: ${user ? 'Authenticated' : 'Not authenticated'}`);
    console.log(`⏳ Initializing: ${initializing}`);
    console.log(`🔄 Loading: ${loading}`);
    console.log(`❌ Error: ${error ? error.message : 'none'}`);
    
    // Check supabase session
    try {
      const { data } = await supabase.auth.getSession();
      console.log(`🔐 Supabase session: ${data?.session ? 'exists' : 'null'}`);
      if (data?.session) {
        console.log(`👤 Session user: ${data.session.user.email}`);
        console.log(`⏰ Session expires: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
      }
    } catch (err) {
      console.error('Error checking Supabase session:', err);
    }
    
    // Check AsyncStorage auth state
    try {
      const isAuth = await AsyncStorage.getItem('isAuthenticated');
      console.log(`💾 AsyncStorage isAuthenticated: ${isAuth}`);
      
      // Check if session is stored in AsyncStorage directly
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => key.includes('supabase.auth'));
      console.log(`📦 Auth keys in AsyncStorage: ${authKeys.length > 0 ? authKeys.join(', ') : 'none'}`);
    } catch (err) {
      console.error('Error checking AsyncStorage:', err);
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    console.log('🚀 AuthProvider mounted - initializing auth state');
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event);
      console.log('🔑 Session after change:', session ? 'exists' : 'null');
      
      if (session?.user) {
        console.log('👤 User email:', session.user.email);
        console.log('🆔 User ID:', session.user.id);
        // Set auth flag in AsyncStorage
        AsyncStorage.setItem('isAuthenticated', 'true')
          .then(() => console.log('✅ AsyncStorage isAuthenticated set to true'))
          .catch(err => console.error('❌ Error setting isAuthenticated:', err));
      } else if (event === 'SIGNED_OUT') {
        // Clear auth flag in AsyncStorage
        AsyncStorage.setItem('isAuthenticated', 'false')
          .then(() => console.log('✅ AsyncStorage isAuthenticated set to false'))
          .catch(err => console.error('❌ Error clearing isAuthenticated:', err));
      }
      
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    // Get current session
    const getInitialSession = async () => {
      console.log('🔍 Getting initial session...');
      try {
        // Check AsyncStorage first for quick auth check
        const storedAuthState = await AsyncStorage.getItem('isAuthenticated');
        console.log('💾 Stored auth state from AsyncStorage:', storedAuthState);
        
        // Get actual session from Supabase
        console.log('🔄 Requesting session from Supabase...');
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting initial session:', sessionError);
          throw sessionError;
        }
        
        console.log('🔐 Initial session retrieved:', data.session ? 'exists' : 'null');
        if (data.session) {
          console.log('👤 Session user email:', data.session.user.email);
          
          // Ensure AsyncStorage matches Supabase state
          if (storedAuthState !== 'true') {
            console.log('⚠️ AsyncStorage auth state out of sync, updating...');
            await AsyncStorage.setItem('isAuthenticated', 'true');
          }
        } else {
          // No session, ensure AsyncStorage is consistent
          if (storedAuthState === 'true') {
            console.log('⚠️ AsyncStorage claims auth but no session exists, fixing...');
            await AsyncStorage.setItem('isAuthenticated', 'false');
          }
        }
        
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error('❌ Error checking auth state:', err);
      } finally {
        console.log('✅ Initial session check complete');
        setInitializing(false);
        // Log final state after initialization
        logAuthState('after initialization');
      }
    };

    getInitialSession();

    // Clean up subscription
    return () => {
      console.log('🧹 Cleaning up auth listener subscription');
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Log auth state changes
  useEffect(() => {
    logAuthState('user state changed');
  }, [user, initializing]);

  // Email/Password Login
  const login = async (email, password) => {
    clearError();
    setLoading(true);
    console.log('🔑 Attempting login with email:', email);
    
    try {
      const { user: authUser, session } = await signInWithEmail(email, password);
      
      if (authUser) {
        console.log('✅ Login successful for user:', authUser.email);
        // Ensure user profile exists
        await ensureUserProfile(authUser.id);
        // Set auth flag in AsyncStorage
        await AsyncStorage.setItem('isAuthenticated', 'true');
        console.log('💾 isAuthenticated set in AsyncStorage');
      }
      
      return true;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError({
        message: err.message || 'Failed to sign in'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const signInWithGoogle = async () => {
    clearError();
    setLoading(true);
    
    try {
      console.log('🔑 Initiating Google sign-in...');
      
      // First check if we already have a session
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        console.log('⚠️ Session already exists before Google sign-in!');
        console.log('👤 Existing user:', existingSession.session.user.email);
      }
      
      // Decide whether to use native redirect or Expo AuthSession
      let redirectUrl;
      if (Platform.OS === 'web') {
        // Use direct URL for web
        redirectUrl = window.location.origin + '/auth/callback';
      } else {
        // Use app scheme for native platforms with explicit scheme
        redirectUrl = 'heavenlyhub://auth/callback';
        console.log('📱 Using app scheme redirect URL:', redirectUrl);
        // Check if the URL scheme is registered
        const canOpenURL = await Linking.canOpenURL(redirectUrl);
        console.log('🔗 Can open redirect URL?', canOpenURL);
      }
      
      console.log('🔗 Google Auth Redirect URL:', redirectUrl);
      
      // Start the OAuth flow with Supabase
      console.log('🔄 Starting OAuth flow with Supabase...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) {
        console.error('❌ Supabase OAuth setup error:', error);
        throw error;
      }
      
      // Open the authentication URL in a browser
      if (data?.url) {
        console.log('🌐 Opening browser with URL:', data.url);
        
        try {
          // Use WebBrowser to handle the flow properly
          console.log('🔄 Opening OAuth session in WebBrowser...');
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );
          
          console.log('📱 WebBrowser result type:', result.type);
          
          if (result.type === 'success') {
            console.log('✅ Auth browser session successful');
            
            // Pass the URL to our handleAuthCallback function to process
            if (result.url) {
              console.log('🔗 Success URL:', result.url);
              try {
                // This will extract token from hash fragment and set the session
                const authResult = await handleAuthCallback(result.url);
                console.log('🔐 Auth callback result:', authResult.success ? 'success' : 'failed');
                
                if (authResult.success) {
                  // Set isAuthenticated in AsyncStorage
                  await AsyncStorage.setItem('isAuthenticated', 'true');
                  console.log('💾 isAuthenticated set in AsyncStorage');
                  await logAuthState('after successful Google sign-in via handleAuthCallback');
                  return true;
                } else {
                  console.error('❌ Auth callback processing failed:', authResult.error);
                  throw new Error('Auth callback processing failed');
                }
              } catch (callbackError) {
                console.error('❌ Error in callback handling:', callbackError);
                throw callbackError;
              }
            } else {
              console.log('⚠️ No URL in WebBrowser result');
              // Try to get current session as fallback
              const { data: sessionCheck } = await supabase.auth.getSession();
              if (sessionCheck?.session) {
                console.log('✅ Fallback: session exists after browser auth');
                await AsyncStorage.setItem('isAuthenticated', 'true');
                await logAuthState('after Google browser auth with no URL');
                return true;
              } else {
                console.error('❌ No URL and no session after browser auth');
                throw new Error('No URL in auth result and no session found');
              }
            }
          } else {
            console.log('❌ Auth canceled or failed:', result.type);
            throw new Error(`Authentication was canceled or failed: ${result.type}`);
          }
        } catch (browserError) {
          console.error('❌ WebBrowser error:', browserError);
          throw browserError;
        }
      } else {
        console.error('❌ No authentication URL received from Supabase');
        throw new Error('Failed to get authentication URL');
      }
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      setError({
        message: err.message || 'Failed to sign in with Google'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Apple Sign-In
  const signInWithApple = async () => {
    clearError();
    setLoading(true);
    
    try {
      console.log('🔑 Initiating Apple sign-in...');
      
      // First check if we already have a session
      const { data: existingSession } = await supabase.auth.getSession();
      if (existingSession?.session) {
        console.log('⚠️ Session already exists before Apple sign-in!');
        console.log('👤 Existing user:', existingSession.session.user.email);
      }
      
      // Decide whether to use native redirect or Expo AuthSession
      let redirectUrl;
      if (Platform.OS === 'web') {
        // Use direct URL for web
        redirectUrl = window.location.origin + '/auth/callback';
      } else {
        // Use app scheme for native platforms
        redirectUrl = 'heavenlyhub://auth/callback';
        console.log('📱 Using app scheme redirect URL:', redirectUrl);
        // Check if the URL scheme is registered
        const canOpenURL = await Linking.canOpenURL(redirectUrl);
        console.log('🔗 Can open redirect URL?', canOpenURL);
      }
      
      console.log('🔗 Apple Auth Redirect URL:', redirectUrl);
      
      // Start the OAuth flow with Supabase
      console.log('🔄 Starting OAuth flow with Supabase...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { 
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) {
        console.error('❌ Supabase OAuth setup error:', error);
        throw error;
      }
      
      // Open the authentication URL in a browser
      if (data?.url) {
        console.log('🌐 Opening browser with URL:', data.url);
        
        try {
          // Use WebBrowser to handle the flow properly
          console.log('🔄 Opening OAuth session in WebBrowser...');
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );
          
          console.log('📱 WebBrowser result type:', result.type);
          
          if (result.type === 'success') {
            console.log('✅ Auth browser session successful');
            
            // Pass the URL to our handleAuthCallback function to process
            if (result.url) {
              console.log('🔗 Success URL:', result.url);
              try {
                // This will extract token from hash fragment and set the session
                const authResult = await handleAuthCallback(result.url);
                console.log('🔐 Auth callback result:', authResult.success ? 'success' : 'failed');
                
                if (authResult.success) {
                  // Set isAuthenticated in AsyncStorage
                  await AsyncStorage.setItem('isAuthenticated', 'true');
                  console.log('💾 isAuthenticated set in AsyncStorage');
                  await logAuthState('after successful Apple sign-in via handleAuthCallback');
                  return true;
                } else {
                  console.error('❌ Auth callback processing failed:', authResult.error);
                  throw new Error('Auth callback processing failed');
                }
              } catch (callbackError) {
                console.error('❌ Error in callback handling:', callbackError);
                throw callbackError;
              }
            } else {
              console.log('⚠️ No URL in WebBrowser result');
              // Try to get current session as fallback
              const { data: sessionCheck } = await supabase.auth.getSession();
              if (sessionCheck?.session) {
                console.log('✅ Fallback: session exists after browser auth');
                await AsyncStorage.setItem('isAuthenticated', 'true');
                await logAuthState('after Apple browser auth with no URL');
                return true;
              } else {
                console.error('❌ No URL and no session after browser auth');
                throw new Error('No URL in auth result and no session found');
              }
            }
          } else {
            console.log('❌ Auth canceled or failed:', result.type);
            throw new Error(`Authentication was canceled or failed: ${result.type}`);
          }
        } catch (browserError) {
          console.error('❌ WebBrowser error:', browserError);
          throw browserError;
        }
      } else {
        console.error('❌ No authentication URL received from Supabase');
        throw new Error('Failed to get authentication URL');
      }
    } catch (err) {
      console.error('❌ Apple sign-in error:', err);
      setError({
        message: err.message || 'Failed to sign in with Apple'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Registration
  const register = async (email, password, displayName) => {
    clearError();
    setLoading(true);
    
    try {
      const { user: authUser, session } = await signUpWithEmail(email, password);
      
      // Ensure user profile exists if registration returned a user
      // (In case of no email confirmation requirement)
      if (authUser) {
        await ensureUserProfile(authUser.id);
      }
      
      // Note: For email confirmation flow, the user will need to verify their email
      // before they are fully authenticated
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError({
        message: err.message || 'Failed to sign up'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    clearError();
    setLoading(true);
    
    try {
      console.log('🔑 Attempting logout...');
      
      // First check current session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 Session before logout:', sessionData?.session ? 'exists' : 'null');
      
      // Call Supabase signOut
      const { error } = await supabaseSignOut();
      
      if (error) throw error;
      
      // Clear AsyncStorage auth state regardless of Supabase response
      try {
        await AsyncStorage.setItem('isAuthenticated', 'false');
        console.log('💾 AsyncStorage isAuthenticated set to false');
        
        // Optional: Log keys in AsyncStorage to check if Supabase is properly clearing its data
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(key => key.includes('supabase.auth'));
        console.log(`📦 Auth keys in AsyncStorage after logout: ${authKeys.length > 0 ? authKeys.join(', ') : 'none'}`);
      } catch (storageErr) {
        console.error('❌ Error clearing AsyncStorage auth state:', storageErr);
      }
      
      console.log('✅ Logout successful');
      
      // Double-check that session is actually cleared
      const { data: checkData } = await supabase.auth.getSession();
      console.log('🔍 Session after logout:', checkData?.session ? 'still exists (problem!)' : 'cleared successfully');
      
      return true;
    } catch (err) {
      console.error('❌ Logout error:', err);
      setError({
        message: err.message || 'Failed to sign out'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle password reset
  const resetPassword = async (email) => {
    clearError();
    setLoading(true);
    
    try {
      await supabaseResetPassword(email);
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError({
        message: err.message || 'Failed to reset password'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        loading,
        error,
        login,
        signInWithGoogle,
        signInWithApple,
        register,
        logout,
        resetPassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; 