// components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Starting signIn for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('AuthProvider signIn error:', error);
        throw error;
      }

      console.log('AuthProvider: SignIn successful:', data);
      setUser(data.user);
      return data;
      
    } catch (error) {
      console.error('AuthProvider signIn failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Starting signUp for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('AuthProvider signUp error:', error);
        throw error;
      }

      console.log('AuthProvider: SignUp successful:', data);
      
      // Note: User might need to confirm email before they can sign in
      if (data.user && !data.session) {
        console.log('User created but needs email confirmation');
      }
      
      return data;
      
    } catch (error) {
      console.error('AuthProvider signUp failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthProvider: Starting logout...');
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      // Clear user state
      setUser(null);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentTenantId');
        localStorage.removeItem('currentPropertyId');
        localStorage.clear();
      }
      
      console.log('AuthProvider: Logout successful, redirecting...');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('AuthProvider logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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