// frontend/src/App.jsx
// PointsPath v4 — Dropdowns for city selection, Hong Kong tab added

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './context/AuthContext'
import UserMenu from './components/auth/UserMenu'
import ProtectedRoute from './components/auth/ProtectedRoute'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const track = (event, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

const COUNTRIES = [
  { code: 'CA', label: 'Canada',    flag: '🇨🇦', program: 'Aeroplan',    gradFrom: '#DC2626', gradTo: '#B91C1C', accent: 'red'    },
  { code: 'US', label: 'USA',       flag: '🇺🇸', program: 'MileagePlus', gradFrom: '#2563EB', gradTo: '#1D4ED8', accent: 'blue'   },
  { code: 'IN', label: 'India',     flag: '🇮🇳', program: 'Air India One',gradFrom: '#EA580C', gradTo: '#C2410C', accent: 'orange' },
  { code: 'HK', label: 'Hong Kong', flag: '🇭🇰', program: 'Asia Miles',  gradFrom: '#DC2626', gradTo: '#7C3AED', accent: 'purple' },
]

const ACCENT = {
  red:    { ring: 'focus:ring-red-500',    btn: 'bg-red-600 hover:bg-red-700',       active: 'text-red-600 border-red-600',    badge: 'bg-red-100 text-red-700'    },
  blue:   { ring: 'focus:ring-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700',     active: 'text-blue-600 border-blue-600',  badge: 'bg-blue-100 text-blue-700'  },
  orange: { ring: 'focus:ring-orange-500', btn: 'bg-orange-500 hover:bg-orange-600', active: 'text-orange-600 border-orange-600', badge: 'bg-orange-100 text-orange-700' },
  purple: { ring: 'focus:ring-purple-500', btn: 'bg-purple-600 hover:bg-purple-700', active: 'text-purple-600 border-purple-600', badge: 'bg-purple-100 text-purple-700' },
}

export default function App() {
  const { user } = useAuth()
  const [activeTab,  setActiveTab]  = useState('trip')
  const [country,    setCountry]    = useState('CA')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [result,     setResult]     = useState(null)
  const [cards,      setCards]      = useState([])
  const [cities,     setCities]     = useState({ from_cities: [], to_cities: [] })
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const cc   = COUNTRIES.find(c => c.code === country)
  const ac   = ACCENT[cc.accent]

  // ── Load cities for dropdowns ─────────────────────────────────────────────
  const loadCities = useCallback(async (countryCode) => {
    setCitiesLoading(true)
    try {
      const res = await axios.get(`${API_URL}/cities?country=${countryCode}`)
      setCities(res.data)
    } catch {
      setCities({ from_cities: [], to_cities: [] })
    } finally {
      setCitiesLoading(false)
    }
  }, [])

  // ── Load cards for gap calculator ─────────────────────────────────────────
  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/cards?country=${country}`)
        .then(r => setCards(r.data?.cards || []))
        .catch(() => setCards([]))
      loadCities(country)
    }
  }, [user, country, loadCities])

  // Trip form
  const [tripForm, setTripForm] = useState({
    from_city: '', to_city: '', depart_date: '', return_date: '',
    passengers: 1, travel_class: 'economy'
  })

  // Gap form
  const [gapForm, setGapForm] = useState({
    points_needed: '', points_current: '', timeline_months: 12,
    card_ids: [], monthly_budget: ''
  })

  // Reset form cities when country changes
  useEffect(() => {
    setTripForm(f => ({ ...f, from_city: '', to_city: '' }))
    setGapForm(f => ({ ...f, card_ids: [] }))
    setResult(null)
    setError(null)
  }, [country])

  // Track login
  useEffect(() => {
    if (user) track('login', { method: 'OTP', country })
  }, [user])

  const switchTab = (tab) => {
    setActiveTab(tab); setResult(null); setError(null)
    track('tab_switch', { tab, country })
  }

  const switchCountry = (code) => {
    setCountry(code); setMobileMenu(false)
    track('country_switch', { country: code })
  }

  // ── Trip submit ───────────────────────────────────────────────────────────
  const handleTripSubmit = async (e) => {
    e.preventDefault()
    if (!tripForm.from_city || !tripForm.to_city) {
      setError('Please select both a departure and destination city.')
      return
    }
    setLoading(true); setError(null); setResult(null)
    try {
      const payload = {
        from_city: tripForm.from_city,
        to_city: tripForm.to_city,
        depart_date: tripForm.depart_date || new Date().toISOString().split('T')[0],
        return_date: tripForm.return_date || null,
        passengers: parseInt(tripForm.passengers) || 1,
        travel_class: tripForm.travel_class,
        country,
      }
      const res = await axios.post(`${API_URL}/calculate-points`, payload)
      setResult({ type: 'trip', data: res.data })
      track('calculate_points', { country, from: payload.from_city, to: payload.to_city, class: payload.travel_class })
    } catch (err) {
      setError(err.response?.data?.detail || 'Route not found. Please select cities from the dropdowns.')
    } finally {
      setLoading(false)
    }
  }

  // ── Gap submit ────────────────────────────────────────────────────────────
  const handleGapSubmit = async (e) => {
    e.preventDefault()
    if (gapForm.card_ids.length === 0) { setError('Please select at least one card.'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await axios.post(`${API_URL}/calculate-gap`, {
        points_needed: parseInt(gapForm.points_needed),
        points_current: parseInt(gapForm.points_current) || 0,
        timeline_months: parseInt(gapForm.timeline_months) || 12,
        card_ids: gapForm.card_ids.map(Number),
        monthly_budget: gapForm.monthly_budget ? parseInt(gapForm.monthly_budget) : null,
        country,
      })
      setResult({ type: 'gap', data: res.data })
      track('calculate_gap', { country, points_needed: gapForm.points_needed })
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCard = (id) => {
    setGapForm(f => ({
      ...f,
      card_ids: f.card_ids.includes(id) ? f.card_ids.filter(c => c !== id) : [...f.card_ids, id]
    }))
  }

  // ── Shared select style ───────────────────────────────────────────────────
  const sel = `w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 ${ac.ring} focus:border-transparent disabled:opacity-50`

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shadow-sm transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${cc.gradFrom}, ${cc.gradTo})` }}>
                ✈
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">PointsPath</span>
                <span className="hidden sm:inline text-xs text-slate-400 ml-2">Travel Rewards Optimizer</span>
              </div>
            </div>

            {/* Country switcher — desktop */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => switchCountry(c.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    country === c.code ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <span>{c.flag}</span><span>{c.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-2xl">{cc.flag}</button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mobile country menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Country</p>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => switchCountry(c.code)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium justify-center transition-all ${
                    country === c.code ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                  style={country === c.code ? { background: `linear-gradient(135deg, ${c.gradFrom}, ${c.gradTo})` } : {}}>
                  {c.flag} {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex">
            {[
              { key: 'trip', label: 'Trip Calculator', icon: '✈' },
              { key: 'gap',  label: 'Points Gap',      icon: '📊' },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => switchTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key ? `${ac.active} border-current` : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="text-white" style={{ background: `linear-gradient(135deg, ${cc.gradFrom}, ${cc.gradTo})` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{cc.flag} {cc.label} — {cc.program}</h1>
            <p className="text-white/75 text-sm mt-0.5">
              {country === 'CA' && 'Aeroplan, Scene+, Avion, TD Rewards & more'}
              {country === 'US' && 'Chase UR, Amex MR, Capital One, Citi & more'}
              {country === 'IN' && 'Air India One, HDFC Infinia, Axis Magnus & more'}
              {country === 'HK' && 'Asia Miles, HSBC, Citi, Standard Chartered & more'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/80 text-sm">
            <span><span className="font-bold text-white">
              {country === 'CA' ? '22' : country === 'US' ? '24' : country === 'IN' ? '18' : '12'}
            </span> Cards</span>
            <span className="opacity-40">·</span>
            <span><span className="font-bold text-white">
              {country === 'CA' ? '200+' : country === 'US' ? '180+' : country === 'IN' ? '140+' : '90+'}
            </span> Routes</span>
          </div>
        </div>
      </div>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <ProtectedRoute country={country} accentColor={`linear-gradient(135deg, ${cc.gradFrom}, ${cc.gradTo})`}>

          {/* ── Trip Calculator ─────────────────────────────────────────────── */}
          {activeTab === 'trip' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">How many points do you need?</h2>
                <p className="text-slate-500 text-sm mb-6">Select your route and we'll calculate the exact points required</p>

                <form onSubmit={handleTripSubmit} className="space-y-5">

                  {/* ── FROM / TO dropdowns ──────────────────────────────── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        From (departure city)
                      </label>
                      <select
                        value={tripForm.from_city}
                        onChange={e => setTripForm({ ...tripForm, from_city: e.target.value, to_city: '' })}
                        required
                        disabled={citiesLoading}
                        className={sel}
                      >
                        <option value="">
                          {citiesLoading ? 'Loading cities...' : `Select departure city`}
                        </option>
                        {cities.from_cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">Domestic cities only</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        To (destination)
                      </label>
                      <select
                        value={tripForm.to_city}
                        onChange={e => setTripForm({ ...tripForm, to_city: e.target.value })}
                        required
                        disabled={!tripForm.from_city || citiesLoading}
                        className={sel}
                      >
                        <option value="">
                          {!tripForm.from_city ? 'Select departure first' : 'Select destination'}
                        </option>
                        {/* Filter out the selected from_city to avoid same-city routes */}
                        {cities.to_cities
                          .filter(city => city !== tripForm.from_city)
                          .map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))
                        }
                      </select>
                      <p className="text-xs text-slate-400 mt-1">Domestic & international</p>
                    </div>
                  </div>

                  {/* ── Cabin / Passengers / Dates ───────────────────────── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cabin</label>
                      <select value={tripForm.travel_class}
                        onChange={e => setTripForm({ ...tripForm, travel_class: e.target.value })}
                        className={sel}>
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Prem. Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Passengers</label>
                      <select value={tripForm.passengers}
                        onChange={e => setTripForm({ ...tripForm, passengers: e.target.value })}
                        className={sel}>
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Depart</label>
                      <input type="date" value={tripForm.depart_date}
                        onChange={e => setTripForm({ ...tripForm, depart_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className={sel} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Return (opt)</label>
                      <input type="date" value={tripForm.return_date}
                        onChange={e => setTripForm({ ...tripForm, return_date: e.target.value })}
                        min={tripForm.depart_date || new Date().toISOString().split('T')[0]}
                        className={sel} />
                    </div>
                  </div>

                  {error && <ErrorAlert message={error} />}

                  <button type="submit" disabled={loading || !tripForm.from_city || !tripForm.to_city}
                    className={`w-full py-3 rounded-xl ${ac.btn} text-white font-semibold text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm`}>
                    {loading ? <><Spinner /> Calculating...</> : 'Calculate Points'}
                  </button>
                </form>
              </div>

              {result?.type === 'trip' && <TripResult data={result.data} ac={ac} />}
              <RouteQuickRef country={country} />
            </div>
          )}

          {/* ── Points Gap ──────────────────────────────────────────────────── */}
          {activeTab === 'gap' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Bridge your points gap</h2>
                <p className="text-slate-500 text-sm mb-6">See exactly which card gets you to your goal fastest</p>

                <form onSubmit={handleGapSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Points Needed</label>
                      <input type="number" min="0" value={gapForm.points_needed}
                        onChange={e => setGapForm({ ...gapForm, points_needed: e.target.value })}
                        placeholder="e.g. 85000" required className={sel} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Points You Have</label>
                      <input type="number" min="0" value={gapForm.points_current}
                        onChange={e => setGapForm({ ...gapForm, points_current: e.target.value })}
                        placeholder="e.g. 20000" className={sel} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Timeline</label>
                      <select value={gapForm.timeline_months}
                        onChange={e => setGapForm({ ...gapForm, timeline_months: e.target.value })}
                        className={sel}>
                        {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{m} months</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Monthly Budget (optional — leave blank to auto-calculate)
                    </label>
                    <input type="number" min="0" value={gapForm.monthly_budget}
                      onChange={e => setGapForm({ ...gapForm, monthly_budget: e.target.value })}
                      placeholder="Leave blank to auto-calculate"
                      className={`${sel} max-w-xs`} />
                  </div>

                  {/* Card selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Select cards to compare
                      {gapForm.card_ids.length > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${ac.badge}`}>
                          {gapForm.card_ids.length} selected
                        </span>
                      )}
                    </label>
                    {cards.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">Loading cards...</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                        {cards.map(card => (
                          <label key={card.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                              gapForm.card_ids.includes(card.id)
                                ? `border-slate-300 ${ac.badge}`
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                            }`}>
                            <input type="checkbox" checked={gapForm.card_ids.includes(card.id)}
                              onChange={() => toggleCard(card.id)} className="mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-xs leading-tight">{card.name}</p>
                              <p className="text-slate-400 text-xs mt-0.5">
                                {card.program} · {card.welcome_bonus > 0 ? `${card.welcome_bonus.toLocaleString()} pts bonus` : 'No bonus'}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && <ErrorAlert message={error} />}

                  <button type="submit" disabled={loading || gapForm.card_ids.length === 0 || !gapForm.points_needed}
                    className={`w-full py-3 rounded-xl ${ac.btn} text-white font-semibold text-sm disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm`}>
                    {loading ? <><Spinner /> Calculating...</> : 'Find My Strategy'}
                  </button>
                </form>
              </div>

              {result?.type === 'gap' && <GapResult data={result.data} ac={ac} />}
            </div>
          )}

        </ProtectedRoute>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-bold text-slate-900">✈ PointsPath</p>
              <p className="text-xs text-slate-400 mt-1">Travel rewards optimizer · CA · US · IN · HK</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={() => switchCountry(c.code)}
                  className={`text-xs transition-colors ${country === c.code ? 'text-slate-800 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}>
                  {c.flag} {c.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-6 border-t border-slate-100 pt-4">
            Points estimates are approximate based on typical award rates (2025–2026). Always verify on the airline's website before booking. Not affiliated with any bank, card issuer, or airline.
          </p>
        </div>
      </footer>
    </div>
  )
}

// ── Trip Result ───────────────────────────────────────────────────────────────
function TripResult({ data, ac }) {
  const cabinLabel = data.travel_class?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-slate-900 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Route</p>
            <p className="text-white font-bold text-xl leading-tight">
              {data.route?.replace(' to ', ' → ')}
            </p>
            <p className="text-white/60 text-sm mt-0.5">{cabinLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Points needed</p>
            <p className="text-white font-bold text-3xl">{data.total_points?.toLocaleString()}</p>
            {data.points_per_person !== data.total_points && (
              <p className="text-white/60 text-xs">{data.points_per_person?.toLocaleString()} per person</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm text-slate-600 mb-4">
          💡 Use the <strong>Points Gap</strong> tab to find which card gets you there fastest.
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Economy',      pts: data.total_points ? Math.round(data.total_points * 0.55) : null },
            { label: 'Prem. Economy',pts: data.total_points ? Math.round(data.total_points * 0.8)  : null },
            { label: 'Business',     pts: data.total_points },
            { label: 'First',        pts: data.total_points ? Math.round(data.total_points * 1.6)  : null },
          ].map(tier => tier.pts && (
            <div key={tier.label} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">{tier.label}</p>
              <p className="font-bold text-slate-900 text-sm">{tier.pts.toLocaleString()}</p>
              <p className="text-xs text-slate-400">pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Gap Result ────────────────────────────────────────────────────────────────
function GapResult({ data, ac }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Points Gap',     value: data.points_gap?.toLocaleString() },
            { label: 'Monthly Target', value: data.monthly_points_target?.toLocaleString() },
            { label: 'Timeline',       value: `${data.timeline_months} months` },
            { label: 'Status',         value: data.is_achievable ? '✅ Achievable' : '⚠️ Stretch' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-white/50 text-xs uppercase tracking-wider">{label}</p>
              <p className="font-bold text-base mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {data.budget_status && (
          <p className="mt-3 text-sm text-white/70 border-t border-white/10 pt-3">{data.budget_status}</p>
        )}
      </div>

      {data.strategies?.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {i === 0 && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Best match
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-sm">{s.card_name}</h3>
              </div>
              <p className="text-xs text-slate-500">
                {s.avg_earn_rate}x avg earn rate · ${s.monthly_spend_needed?.toLocaleString()}/mo needed
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-400">Total spend</p>
              <p className="font-bold text-slate-900">${s.total_spend_needed?.toLocaleString()}</p>
            </div>
          </div>
          {s.budget_warning && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">{s.budget_warning}</p>
          )}
          <div className="space-y-1.5 border-t border-slate-50 pt-3">
            {s.category_breakdown?.map((cat, j) => (
              <div key={j} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 capitalize">{cat.category}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{cat.multiplier}x · ${cat.monthly_spend?.toLocaleString()}/mo</span>
                  <span className="font-semibold text-slate-900 w-24 text-right">{cat.monthly_points?.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Quick Reference ───────────────────────────────────────────────────────────
function RouteQuickRef({ country }) {
  const routes = {
    CA: [
      { from: 'Toronto',   to: 'London',    eco: '60,000',  biz: '120,000' },
      { from: 'Toronto',   to: 'Tokyo',     eco: '75,000',  biz: '155,000' },
      { from: 'Vancouver', to: 'Sydney',    eco: '85,000',  biz: '175,000' },
      { from: 'Montreal',  to: 'Paris',     eco: '60,000',  biz: '120,000' },
      { from: 'Toronto',   to: 'Dubai',     eco: '80,000',  biz: '165,000' },
      { from: 'Calgary',   to: 'Tokyo',     eco: '70,000',  biz: '145,000' },
    ],
    US: [
      { from: 'New York',    to: 'London',    eco: '30,000', biz: '57,500'  },
      { from: 'Los Angeles', to: 'Tokyo',     eco: '35,000', biz: '80,000'  },
      { from: 'New York',    to: 'Paris',     eco: '30,000', biz: '57,500'  },
      { from: 'Chicago',     to: 'Dubai',     eco: '40,000', biz: '90,000'  },
      { from: 'Los Angeles', to: 'Sydney',    eco: '40,000', biz: '90,000'  },
      { from: 'New York',    to: 'Singapore', eco: '45,000', biz: '100,000' },
    ],
    IN: [
      { from: 'Mumbai',    to: 'London',    eco: '45,000', biz: '110,000' },
      { from: 'Delhi',     to: 'New York',  eco: '55,000', biz: '130,000' },
      { from: 'Bengaluru', to: 'Singapore', eco: '20,000', biz: '65,000'  },
      { from: 'Mumbai',    to: 'Dubai',     eco: '15,000', biz: '50,000'  },
      { from: 'Delhi',     to: 'Tokyo',     eco: '30,000', biz: '85,000'  },
      { from: 'Mumbai',    to: 'Sydney',    eco: '45,000', biz: '115,000' },
    ],
    HK: [
      { from: 'Hong Kong', to: 'Tokyo',        eco: '25,000', biz: '70,000'  },
      { from: 'Hong Kong', to: 'London',       eco: '60,000', biz: '140,000' },
      { from: 'Hong Kong', to: 'Singapore',    eco: '20,000', biz: '60,000'  },
      { from: 'Hong Kong', to: 'Sydney',       eco: '50,000', biz: '125,000' },
      { from: 'Hong Kong', to: 'New York',     eco: '80,000', biz: '170,000' },
      { from: 'Hong Kong', to: 'Los Angeles',  eco: '75,000', biz: '160,000' },
    ],
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="font-semibold text-slate-900 text-sm mb-3">
        📋 Popular Routes — Quick Reference (one-way, per person)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="text-left pb-2 font-semibold">Route</th>
              <th className="text-right pb-2 font-semibold">Economy</th>
              <th className="text-right pb-2 font-semibold">Business</th>
            </tr>
          </thead>
          <tbody>
            {(routes[country] || []).map((r, i) => (
              <tr key={i} className="border-b border-slate-50 last:border-0">
                <td className="py-2 text-slate-700 font-medium">{r.from} → {r.to}</td>
                <td className="py-2 text-right text-slate-500">{r.eco}</td>
                <td className="py-2 text-right text-slate-900 font-semibold">{r.biz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ErrorAlert({ message }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
      <span className="flex-shrink-0 mt-0.5">⚠</span><span>{message}</span>
    </div>
  )
}
function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}
