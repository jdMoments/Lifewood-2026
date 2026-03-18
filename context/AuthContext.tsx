import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isApproved: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T> | PromiseLike<T>, ms: number, message: string): Promise<T> => {
    return Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
    ]);
  };

  const ensureProfile = async () => {
    try {
      const { error } = await withTimeout<{ error: any }>(
        supabase.rpc('ensure_my_profile') as any,
        5000,
        'Ensure profile timeout'
      );

      if (error) {
        // Non-fatal: some environments may not have the RPC yet.
        console.warn('ensure_my_profile RPC failed:', error);
      }
    } catch (err) {
      // Non-fatal safety fallback.
      console.warn('ensure_my_profile RPC unavailable or timed out:', err);
    }
  };

  const fetchProfile = async (userId: string, timeoutMs = 8000) => {
    try {
      const { data, error } = await withTimeout<{ data: any; error: any }>(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle() as any,
        timeoutMs,
        'Profile fetch timeout'
      );

      if (error) throw error;

      if (data) {
        setProfile(data);
        setIsApproved(Boolean(data.is_approved));
        setIsAdmin((data.role || '').toLowerCase() === 'admin');
      } else {
        setProfile(null);
        setIsApproved(false);
        setIsAdmin(false);
      }
    } catch (err) {
      console.warn('Profile fetch failed or timed out:', err);
      setProfile(null);
      setIsApproved(false);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await ensureProfile();
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session with timeout safety
        const result = await withTimeout(
          supabase.auth.getSession(),
          20000,
          'Session fetch timeout'
        ) as any;
        const session = result?.data?.session ?? null;
        
        if (!mounted) return;

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await ensureProfile();
          await fetchProfile(currentUser.id, 5000);
        }
      } catch (err) {
        // Use warn instead of error for timeout as we have a fallback listener
        if (err instanceof Error && err.message === 'Session fetch timeout') {
          console.warn('Auth session fetch timed out, relying on state change listener');
        } else {
          console.error('Auth initialization error:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.email);
      
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Avoid flashing loading UI on background token refresh
        const shouldShowLoading =
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          event === 'PASSWORD_RECOVERY';

        if (shouldShowLoading) setLoading(true);
        try {
          await ensureProfile();
          await fetchProfile(currentUser.id, 5000);
        } catch (err) {
          console.error('Error fetching profile on auth change:', err);
        } finally {
          if (mounted && shouldShowLoading) setLoading(false);
        }
      } else {
        setProfile(null);
        setIsApproved(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isApproved, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
