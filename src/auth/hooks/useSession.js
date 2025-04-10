// src/auth/hooks/useSession.js
// Hook for managing Supabase session state

import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { ensureUserProfile } from '../services/profile-service';

export function useSession() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        setLoading(true);
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Only update state if component is still mounted
        if (mounted) {
          if (data?.session) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Ensure user profile exists
            try {
              await ensureUserProfile(data.session.user.id);
            } catch (profileError) {
              console.error('Error ensuring user profile:', profileError);
            }
          }
        }
      } catch (e) {
        if (mounted) {
          setError(e);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
          
          // When a user signs in, ensure they have a profile
          if (event === 'SIGNED_IN' && newSession?.user) {
            try {
              await ensureUserProfile(newSession.user.id);
            } catch (profileError) {
              console.error('Error ensuring user profile on sign in:', profileError);
            }
          }
        }
      }
    );

    // Clean up subscription and mounted flag
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading,
    error,
    isAuthenticated: !!session,
  };
} 