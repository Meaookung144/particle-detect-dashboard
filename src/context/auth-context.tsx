'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  fullName?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: { fullName?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        // Fetch more user details from your users table if needed
        try {
          const { data, error } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', session.user.id)
            .single();

          if (error) throw error;

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: data?.full_name || undefined,
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      setLoading(false);
    };

    getSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', session.user.id)
              .single();

            if (error) throw error;

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: data?.full_name || undefined,
            });
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      // Sign up with Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authUser) throw new Error('User registration failed');

      // Insert into custom users table
      const { error: dbError } = await supabase.from('users').insert({
        id: authUser.id,
        email,
        password_hash: 'managed_by_supabase_auth', // You don't need to store the password again
        full_name: fullName,
      });

      if (dbError) throw dbError;

      // Update the user state
      setUser({
        id: authUser.id,
        email,
        fullName,
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: { user: authUser }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!authUser) throw new Error('Login failed');

      // Fetch user details
      const { data, error: dbError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', authUser.id)
        .single();

      if (dbError) throw dbError;

      setUser({
        id: authUser.id,
        email,
        fullName: data?.full_name,
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: { fullName?: string }) => {
    if (!user) throw new Error('No user logged in');

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: data.fullName })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        fullName: data.fullName,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}