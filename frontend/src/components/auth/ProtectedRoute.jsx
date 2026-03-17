// frontend/src/components/auth/ProtectedRoute.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import LoginModal from "./LoginModal";

export default function ProtectedRoute({ children, country = 'CA', accentColor = 'from-red-600 to-red-700' }) {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const countryInfo = {
    CA: { flag: '🇨🇦', name: 'Canada', features: ['242+ Aeroplan flight routes', 'All 22 Canadian credit cards', 'Trip & points gap calculator', 'Personalized earning strategy'] },
    US: { flag: '🇺🇸', name: 'USA',    features: ['180+ US routes (domestic & intl)', '24 top US credit cards', 'Chase, Amex, Capital One & more', 'Points gap optimizer'] },
    IN: { flag: '🇮🇳', name: 'India',  features: ['120+ India routes', '18 Indian credit cards', 'Air India One, InterMiles & more', 'International reward optimizer'] },
  }
  const info = countryInfo[country] || countryInfo.CA

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <svg className="animate-spin h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center px-4 py-12 min-h-64">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-md overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${accentColor}`} />
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">{info.flag}</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock the Calculator</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
              Free access — sign in with your email and a one-time code. No password, no credit card.
            </p>
            <ul className="text-left space-y-2.5 mb-7 max-w-xs mx-auto">
              {info.features.map(f => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowLogin(true)}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${accentColor} text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:opacity-95`}>
              Get Free Access →
            </button>
            <p className="text-xs text-slate-400 mt-3">Takes 30 seconds · No password ever</p>
          </div>
        </div>
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      </div>
    );
  }

  return children;
}
