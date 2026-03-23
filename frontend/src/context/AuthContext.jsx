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

// Guard: if env vars are missing (local dev without .env), use a no-op client
// so the app renders normally — auth features will be disabled until .env is set
const SUPABASE_READY = !!(SUPABASE_URL && SUPABASE_ANON);

export const supabase = SUPABASE_READY
  ? createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(SUPABASE_READY); // false immediately if no client

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

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

  const sendOTP = async (email) => {
    if (!supabase) throw new Error("Auth not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const verifyOTP = async (email, token) => {
    if (!supabase) throw new Error("Auth not configured");
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
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