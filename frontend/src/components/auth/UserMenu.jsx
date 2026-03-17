// frontend/src/components/auth/UserMenu.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import LoginModal from "./LoginModal";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [showLogin,    setShowLogin]    = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!user) {
    return (
      <>
        <button onClick={() => setShowLogin(true)}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors">
          Sign In
        </button>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      </>
    );
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "PP";

  return (
    <div className="relative" ref={dropRef}>
      <button onClick={() => setShowDropdown(v => !v)}
        className="w-9 h-9 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center transition-colors shadow-sm"
        aria-label="User menu">
        {initials}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-50"
          style={{ animation: "ppFadeDown 0.12s ease" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
              <p className="text-xs text-slate-400">Free plan</p>
            </div>
          </div>
          <div className="h-px bg-slate-100 my-1" />
          <button onClick={() => { logout(); setShowDropdown(false); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      )}
      <style>{`@keyframes ppFadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
