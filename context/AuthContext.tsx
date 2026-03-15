import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isApproved: boolean;
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
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
      setIsApproved(data.is_approved);
    } else {
      setProfile(null);
      setIsApproved(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session with a longer timeout safety (20s)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout')), 20000)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const session = result?.data?.session ?? null;
        
        if (!mounted) return;

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          try {
            // Fetch profile with a shorter timeout so it doesn't block app boot
            const profilePromise = fetchProfile(currentUser.id);
            const profileTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );
            await Promise.race([profilePromise, profileTimeout]);
          } catch (profileErr) {
            console.warn('Profile fetch issue during init:', profileErr);
            // We don't rethrow here, so finally block runs and app boots
          }
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
        // Only show loading if we don't have a profile yet or if it's a significant change
        if (!profile || profile.id !== currentUser.id) {
          setLoading(true);
          try {
            await fetchProfile(currentUser.id);
          } catch (err) {
            console.error('Error fetching profile on auth change:', err);
          } finally {
            if (mounted) setLoading(false);
          }
        }
      } else {
        setProfile(null);
        setIsApproved(false);
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
    <AuthContext.Provider value={{ session, user, profile, isApproved, loading, signOut, refreshProfile }}>
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
