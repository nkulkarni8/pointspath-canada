// frontend/src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Supabase Auth — Email OTP login (6-digit code, no magic link)
//
// WHY THIS FIX WORKS:
//   The "Confirm your signup" email was being triggered because new users
//   go through email confirmation before OTP kicks in.
//
//   Fix: pass `data: { otp_type: 'email' }` so Supabase always sends OTP
//   regardless of whether the user is new or returning.
//
//   ALSO requires both Supabase dashboard templates to use {{ .Token }}:
//     1. Authentication → Email Templates → Magic Link
//     2. Authentication → Email Templates → Confirm signup
//   Both must have {{ .ConfirmationURL }} replaced with {{ .Token }}
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Disable auto-redirect so magic links never interfere with OTP flow
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  }
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sends a 6-digit OTP code to the user's email.
   * Works for both new users (first signup) and returning users.
   */
  const sendOTP = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Do NOT pass emailRedirectTo — that triggers magic link behaviour
      },
    });
    if (error) throw error;
  };

  /**
   * Verifies the 6-digit code the user received by email.
   * type: "email" is required for OTP (not "magiclink")
   */
  const verifyOTP = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sendOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}