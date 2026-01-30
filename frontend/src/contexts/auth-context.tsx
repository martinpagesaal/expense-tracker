import type { Session, User } from '@supabase/supabase-js';
import * as React from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
}

export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Failed to load session:', error);
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isSupabaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
