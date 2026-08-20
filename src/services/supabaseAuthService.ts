import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface SupabaseUserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  companyName?: string | null;
  createdAt?: string;
}

export class SupabaseAuthService {
  /**
   * Check if Supabase connection is available
   */
  static isAvailable(): boolean {
    return isSupabaseConfigured;
  }

  /**
   * Register with Email and Password
   */
  static async registerWithEmail(name: string, email: string, pass: string): Promise<{ user: User | null; session: Session | null }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: pass,
      options: {
        data: {
          display_name: trimmedName,
          full_name: trimmedName,
          name: trimmedName
        }
      }
    });

    if (error) {
      console.error('Supabase Sign Up Error:', error);
      throw error;
    }

    return { user: data.user, session: data.session };
  }

  /**
   * Login with Email and Password
   */
  static async loginWithEmail(email: string, pass: string): Promise<{ user: User | null; session: Session | null }> {
    const trimmedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: pass
    });

    if (error) {
      console.error('Supabase Sign In Error:', error);
      throw error;
    }

    return { user: data.user, session: data.session };
  }

  /**
   * Login with Google OAuth popup / redirect
   */
  static async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Supabase Google OAuth Error:', error);
      throw error;
    }
  }

  /**
   * Send Password Reset Email
   */
  static async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Supabase Reset Password Error:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase sign out error:', error);
    }
  }

  /**
   * Get current session and user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Get current active session
   */
  static async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
}
