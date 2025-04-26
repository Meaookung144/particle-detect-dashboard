"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { Database } from "./database.types"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

type User = any;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error.message);
          return;
        }
        
        if (data?.session) {
          setUser(data.session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth state changed: ${event}`);
        setUser(session?.user || null);
        setLoading(false);
        
        // No need to manually insert users as this is handled by Supabase Auth
        // with your database schema and RLS policies
      }
    );

    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // First, sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) throw error;
      
      // Note: We don't need to manually create a user record in the users table
      // because we're using Supabase Auth's built-in functionality with RLS
      // The user will be automatically created via auth.users()
      
      // However, if you need to store additional user metadata beyond what's in auth.users(),
      // you can do so here. In your schema, you would need to adapt this to match your users table:
      
      /* 
      if (data?.user) {
        // This step is conditional based on your database structure and needs
        const { error: dbError } = await supabase
          .from("user_profiles")  // For example, a separate profiles table
          .insert({
            user_id: data.user.id,
            first_name: firstName,
            last_name: lastName,
          });

        if (dbError) {
          console.error("Error inserting user profile:", dbError.message);
        }
      }
      */
      
      return data;
    } catch (error: any) {
      console.error("Sign up error:", error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error("Sign in error:", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push("/login");
    } catch (error: any) {
      console.error("Sign out error:", error.message);
      toast.error("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export supabase client for direct usage when needed
export { supabase };