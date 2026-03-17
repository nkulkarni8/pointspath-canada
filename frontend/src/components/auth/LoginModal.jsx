// frontend/src/components/auth/LoginModal.jsx
// FIXES:
//   1. OTP modal fits on one screen (compact layout, max-h with scroll guard)
//   2. Supabase sends 6-digit code — requires email template fix in dashboard (see guide)
//   3. OTP digit boxes properly sized and visible on all screen sizes

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const { sendOTP, verifyOTP } = useAuth();

  const [step,      setStep]      = useState("email");
  const [email,     setEmail]     = useState("");
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);
  const [countdown, setCountdown] = useState(0);

  const emailRef = useRef(null);
  const otpRefs  = useRef([]);

  useEffect(() => {
    if (isOpen && step === "email") setTimeout(() => emailRef.current?.focus(), 120);
  }, [isOpen, step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const reset = () => {
    setStep("email"); setEmail(""); setOtp(["","","","","",""]);
    setError(""); setSuccess(false); setCountdown(0);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await sendOTP(email);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err.message || "Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (tokenOverride) => {
    const token = typeof tokenOverride === "string" ? tokenOverride : otp.join("");
    if (token.length < 6) return;
    setError(""); setLoading(true);
    try {
      await verifyOTP(email, token);
      setSuccess(true);
      setTimeout(() => { onSuccess?.(); handleClose(); }, 1200);
    } catch {
      setError("Invalid or expired code. Please try again.");
      setOtp(["","","","","",""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join("").length === 6) handleVerifyOTP(next.join(""));
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["","","","","",""];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError(""); setOtp(["","","","","",""]); setLoading(true);
    try {
      await sendOTP(email);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Could not resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
    >
      {/* ── Modal card: max-h to ensure it always fits on screen ── */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
        style={{ animation: "ppSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)", maxHeight: "95vh", overflowY: "auto" }}
      >
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-900 text-sm tracking-tight">✈ PointsPath</span>
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors text-base leading-none" aria-label="Close">×</button>
          </div>

          {/* Success */}
          {success && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-2xl text-green-600" style={{ animation: "ppPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>
              <p className="text-lg font-bold text-gray-900">Signed in!</p>
            </div>
          )}

          {/* Email step */}
          {!success && step === "email" && (
            <>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in free</h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">Enter your email — we'll send a 6-digit code. No password ever.</p>

              <form onSubmit={handleSendOTP} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
                </div>
                {error && <ErrorBox message={error} />}
                <button type="submit" disabled={loading || !email}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {loading ? <Spinner /> : "Send Code →"}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">By signing in you agree to receive travel tips. Unsubscribe anytime.</p>
            </>
          )}

          {/* OTP step */}
          {!success && step === "otp" && (
            <>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Check your inbox</h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Code sent to <span className="font-semibold text-gray-800 break-all">{email}</span>
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Enter 6-digit code</label>
                {/* Fixed-size OTP boxes that always fit */}
                <div className="grid grid-cols-6 gap-1.5 mb-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={(el) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-full h-10 rounded-lg border-2 text-center text-lg font-bold text-gray-900 focus:outline-none transition-all ${
                        digit ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50 focus:border-indigo-400"
                      }`}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                {error && <ErrorBox message={error} />}
                <button onClick={() => handleVerifyOTP()} disabled={loading || otp.join("").length < 6}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2">
                  {loading ? <Spinner /> : "Verify & Sign In"}
                </button>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-xs">
                <span className="text-gray-400">Didn't get it?</span>
                {countdown > 0
                  ? <span className="text-gray-400">Resend in {countdown}s</span>
                  : <button onClick={handleResend} className="text-indigo-600 font-semibold underline">Resend</button>
                }
              </div>
              <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors block">
                ← Different email
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ppSlideUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes ppPopIn   { from { transform:scale(0.5); opacity:0; } to { transform:scale(1); opacity:1; } }
      `}</style>
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
      <span className="flex-shrink-0 mt-0.5">⚠</span><span>{message}</span>
    </div>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
