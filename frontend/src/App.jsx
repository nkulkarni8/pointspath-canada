import React, { useState, useEffect } from 'react';
import { Plane, Calculator, ArrowLeft, MapPin, Calendar, Users, CreditCard, TrendingUp, AlertCircle, Home } from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================
// HELPER: Google Analytics Event Tracking
// ============================================
const trackEvent = (eventName, params = {}) => {
  console.log('🔔 Tracking Event:', eventName, params);
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// ============================================
// COMPONENT: Email Capture
// ============================================
function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await axios.post(`${API_URL}/subscribe-email`, null, {
        params: { email: email }
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('🎉 Success! Check your email to confirm.');
        setEmail('');
        
        trackEvent('email_signup', {
          'event_category': 'engagement',
          'event_label': 'newsletter'
        });
      } else {
        throw new Error('Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setStatus('error');
      setMessage('Oops! Something went wrong. Please try again.');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg mb-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">
          💰 Get Free Points Strategies Every Week
        </h2>
        <p className="text-blue-100 mb-6">
          Join 500+ Canadians getting bonus alerts, optimization tips, and exclusive strategies delivered free.
        </p>

        {status === 'success' ? (
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing...' : 'Get Free Tips →'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-red-200 mt-2 text-sm">{message}</p>
        )}

        <p className="text-xs text-blue-200 mt-3">
          ✓ Free forever · Unsubscribe anytime · No spam, ever
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [cards, setCards] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Flow 1: Trip Calculator
  const [formData, setFormData] = useState({
    from_city: '',
    to_city: '',
    depart_date: '',
    return_date: '',
    adults: 1,
    children: 0,
    infants: 0,
    travel_class: 'economy'
  });
  const [tripResult, setTripResult] = useState(null);
  const [tripError, setTripError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Flow 2: Points Gap Calculator
  const [gapFormData, setGapFormData] = useState({
    points_needed: '',
    points_current: '',
    timeline_months: 6,
    monthly_budget: ''
  });
  const [selectedCards, setSelectedCards] = useState([]);
  const [gapResults, setGapResults] = useState(null);
  const [gapError, setGapError] = useState(null);
  const [gapFormErrors, setGapFormErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];

  // Get cities dynamically from routes and group them by region
  const getCitiesByRegion = () => {
    // Extract all unique cities from routes
    const allCities = new Set();
    routes.forEach(route => {
      allCities.add(route.from);
      allCities.add(route.to);
    });

    // Define region patterns
    const regionPatterns = {
      'Domestic Canada': ['Calgary', 'Edmonton', 'Halifax', 'Montreal', 'Ottawa', 'Toronto', 'Vancouver', 'Winnipeg', 'Quebec City'],
      'USA': ['Boston', 'Los Angeles', 'Miami', 'New York', 'San Francisco', 'Chicago', 'Seattle', 'Denver', 'Atlanta', 'Dallas', 'Houston', 'Phoenix', 'Las Vegas', 'Orlando', 'Philadelphia', 'San Diego', 'Portland', 'Minneapolis', 'Detroit', 'Tampa', 'St. Louis', 'Baltimore', 'Cleveland', 'Pittsburgh', 'Cincinnati', 'Kansas City', 'Indianapolis', 'Columbus', 'Charlotte', 'Nashville', 'Milwaukee', 'Salt Lake City', 'Raleigh', 'Richmond', 'Memphis', 'Louisville', 'Oklahoma City', 'Albuquerque', 'Tucson', 'Sacramento', 'Fresno', 'Honolulu', 'Anchorage'],
      'Mexico & Caribbean': ['Barbados', 'Cancun', 'Jamaica', 'Mexico City', 'Montego Bay', 'Puerto Vallarta', 'Los Cabos', 'Cozumel', 'Aruba', 'Bahamas', 'Turks And Caicos', 'St Lucia', 'Bermuda', 'Grand Cayman'],
      'Europe': ['Amsterdam', 'Frankfurt', 'London', 'Paris', 'Rome', 'Madrid', 'Barcelona', 'Berlin', 'Munich', 'Vienna', 'Brussels', 'Zurich', 'Geneva', 'Milan', 'Venice', 'Athens', 'Lisbon', 'Dublin', 'Edinburgh', 'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki', 'Prague', 'Budapest', 'Warsaw', 'Krakow', 'Istanbul', 'Reykjavik'],
      'Asia': ['Hong Kong', 'Seoul', 'Singapore', 'Tokyo', 'Beijing', 'Shanghai', 'Bangkok', 'Manila', 'Delhi', 'Mumbai', 'Osaka', 'Taipei', 'Kuala Lumpur', 'Ho Chi Minh City', 'Hanoi', 'Jakarta', 'Phuket'],
      'Middle East': ['Dubai', 'Tel Aviv', 'Abu Dhabi', 'Doha', 'Riyadh', 'Kuwait City', 'Muscat', 'Amman', 'Beirut', 'Cairo'],
      'Oceania': ['Auckland', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Wellington', 'Christchurch', 'Adelaide', 'Gold Coast', 'Fiji', 'Tahiti'],
      'South America': ['Buenos Aires', 'Sao Paulo', 'Rio De Janeiro', 'Lima', 'Santiago', 'Bogota', 'Caracas', 'Quito', 'Montevideo', 'Cartagena']
    };

    const grouped = {};
    const citiesArray = Array.from(allCities).sort();

    // Group cities by region
    Object.keys(regionPatterns).forEach(region => {
      const citiesInRegion = citiesArray.filter(city => 
        regionPatterns[region].some(pattern => 
          city.toLowerCase().includes(pattern.toLowerCase()) || 
          pattern.toLowerCase().includes(city.toLowerCase())
        )
      );
      if (citiesInRegion.length > 0) {
        grouped[region] = citiesInRegion;
      }
    });

    // Add any remaining cities to "Other Destinations"
    const categorizedCities = new Set(Object.values(grouped).flat());
    const otherCities = citiesArray.filter(city => !categorizedCities.has(city));
    if (otherCities.length > 0) {
      grouped['Other Destinations'] = otherCities;
    }

    return grouped;
  };

  const CITIES_BY_REGION = routes.length > 0 ? getCitiesByRegion() : {
    'Domestic Canada': ['Calgary', 'Edmonton', 'Halifax', 'Montreal', 'Ottawa', 'Toronto', 'Vancouver'],
    'USA': ['Boston', 'Los Angeles', 'Miami', 'New York', 'San Francisco'],
    'Mexico & Caribbean': ['Barbados', 'Cancun', 'Jamaica', 'Mexico City'],
    'Europe': ['Amsterdam', 'Frankfurt', 'London', 'Paris', 'Rome'],
    'Asia': ['Hong Kong', 'Seoul', 'Singapore', 'Tokyo'],
    'Middle East': ['Dubai', 'Tel Aviv'],
    'Oceania': ['Auckland', 'Sydney'],
    'South America': ['Buenos Aires', 'Sao Paulo']
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cardsRes, routesRes] = await Promise.all([
          axios.get(`${API_URL}/cards`),
          axios.get(`${API_URL}/routes`)
        ]);
        
        console.log('📊 Data loaded:', {
          cards: cardsRes.data.cards?.length || cardsRes.data.count || 0,
          routes: routesRes.data.routes?.length || routesRes.data.count || 0
        });
        
        setCards(cardsRes.data.cards || []);
        setRoutes(routesRes.data.routes || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to load data. Please check if the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resetTripForm = () => {
    setFormData({
      from_city: '',
      to_city: '',
      depart_date: '',
      return_date: '',
      adults: 1,
      children: 0,
      infants: 0,
      travel_class: 'economy'
    });
    setTripResult(null);
    setTripError(null);
    setFormErrors({});
  };

  const resetGapForm = () => {
    setGapFormData({
      points_needed: '',
      points_current: '',
      timeline_months: 6,
      monthly_budget: ''
    });
    setSelectedCards([]);
    setGapResults(null);
    setGapError(null);
    setGapFormErrors({});
  };

  const navigateTo = (view) => {
    if (view === 'trip') resetTripForm();
    if (view === 'gap') resetGapForm();
    if (view === 'home') {
      resetTripForm();
      resetGapForm();
    }
    setCurrentView(view);
  };

  const validateTripForm = () => {
    const errors = {};
    
    if (!formData.from_city) errors.from_city = 'Please select departure city';
    if (!formData.to_city) errors.to_city = 'Please select destination city';
    if (formData.from_city === formData.to_city) errors.to_city = 'Destination must be different from departure';
    if (!formData.depart_date) errors.depart_date = 'Departure date is required';
    
    const totalPassengers = parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants);
    if (totalPassengers === 0) errors.passengers = 'At least one passenger required';
    if (totalPassengers > 9) errors.passengers = 'Maximum 9 passengers allowed';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateGapForm = () => {
    const errors = {};
    
    if (!gapFormData.points_needed) errors.points_needed = 'Required';
    if (!gapFormData.points_current) errors.points_current = 'Required';
    if (parseInt(gapFormData.points_needed) <= parseInt(gapFormData.points_current)) {
      errors.points_needed = 'Must be greater than current points';
    }
    if (selectedCards.length === 0) errors.cards = 'Select at least 1 card';

    setGapFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCalculatePoints = async (e) => {
    e.preventDefault();
    
    if (!validateTripForm()) return;

    setLoading(true);
    setTripError(null);
    setTripResult(null);

    const totalPassengers = parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants);

    try {
      const response = await axios.post(`${API_URL}/calculate-points`, {
        from_city: formData.from_city,
        to_city: formData.to_city,
        depart_date: formData.depart_date,
        return_date: formData.return_date || null,
        passengers: totalPassengers,
        travel_class: formData.travel_class
      });

      setTripResult({
        ...response.data,
        passenger_breakdown: {
          adults: formData.adults,
          children: formData.children,
          infants: formData.infants
        },
        is_round_trip: !!formData.return_date
      });
      
      trackEvent('calculate_trip', {
        from_city: formData.from_city,
        to_city: formData.to_city,
        travel_class: formData.travel_class,
        passengers: totalPassengers
      });

    } catch (error) {
      console.error('Error calculating points:', error);
      const errorMessage = error.response?.data?.detail || 
                          `Route not found: ${formData.from_city} to ${formData.to_city}. Please try a different route.`;
      setTripError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateGap = async (e) => {
    e.preventDefault();
    
    if (!validateGapForm()) return;

    setLoading(true);
    setGapError(null);
    setGapResults(null);

    try {
      const response = await axios.post(`${API_URL}/calculate-gap`, {
        points_needed: parseInt(gapFormData.points_needed),
        points_current: parseInt(gapFormData.points_current),
        timeline_months: parseInt(gapFormData.timeline_months),
        card_ids: selectedCards.map(id => parseInt(id)),
        monthly_budget: gapFormData.monthly_budget ? parseInt(gapFormData.monthly_budget) : null
      });

      setGapResults(response.data);
      
      trackEvent('calculate_gap', {
        points_gap: parseInt(gapFormData.points_needed) - parseInt(gapFormData.points_current),
        timeline_months: parseInt(gapFormData.timeline_months),
        cards_selected: selectedCards.length,
        has_budget: !!gapFormData.monthly_budget
      });

    } catch (error) {
      console.error('Error calculating gap:', error);
      const errorMessage = error.response?.data?.detail || 'Error calculating points gap. Please check your inputs.';
      setGapError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelection = (cardId) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else if (prev.length < 5) {
        return [...prev, cardId];
      }
      return prev;
    });
  };

  if (loading && cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading PointsPath Canada...</p>
        </div>
      </div>
    );
  }

  if (error && cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Connect</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // HOME VIEW
  // ============================================================================
  
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg text-3xl">
                🍁
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  PointsPath Canada
                </h1>
                <p className="text-gray-600 text-sm">Your path to free travel with Canadian credit cards</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Email Capture */}
          <EmailCapture />

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Maximize Your Credit Card Points
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Calculate points needed for your dream trip and discover how to earn them with Canadian credit cards
            </p>
          </div>

          {/* Warning Disclaimer */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-6 shadow-md mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-900 text-lg mb-2">Important Information - Please Read</h3>
                <ul className="text-sm text-yellow-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Points are estimates only.</strong> Actual Aeroplan pricing varies ±50-200% by date and demand.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Always verify on Aeroplan.com</strong> before booking. Availability changes constantly.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Welcome bonuses change monthly.</strong> Verify current offers on bank websites before applying.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Educational tool only,</strong> not financial advice. Consult a financial advisor for guidance.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Data current as of January 2026:</strong> {cards.length} cards, {routes.length} routes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <button
              onClick={() => navigateTo('trip')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-500"
            >
              <div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Plane className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Plan a Trip</h3>
              <p className="text-gray-600 mb-4">
                Calculate points needed for your next adventure. Select route, dates, and class for instant results.
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                Start Planning
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            <button
              onClick={() => navigateTo('gap')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-purple-500"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Bridge Points Gap</h3>
              <p className="text-gray-600 mb-4">
                Enter points needed and we'll show you exactly how to earn them with your credit cards.
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                Calculate Strategy
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{cards.length}</div>
              <div className="text-gray-600 font-medium">Canadian Credit Cards</div>
              <div className="text-xs text-gray-500 mt-1">Updated January 2026</div>
            </div>
            <div className="text-center bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl font-bold text-purple-600 mb-2">{routes.length}</div>
              <div className="text-gray-600 font-medium">Bidirectional Routes</div>
              <div className="text-xs text-gray-500 mt-1">All major destinations</div>
            </div>
            <div className="text-center bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Free Forever</div>
              <div className="text-xs text-gray-500 mt-1">No hidden costs</div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold text-lg mb-3">About PointsPath</h3>
                <p className="text-sm text-gray-400">
                  Free tool to help Canadians maximize credit card points for travel rewards.
                  Not affiliated with any bank or airline.
                </p>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-3">Coverage</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>✓ {cards.length} Canadian Credit Cards</li>
                  <li>✓ {routes.length} Bidirectional Routes</li>
                  <li>✓ Updated January 2026</li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-3">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/privacy.html" target="_blank" className="text-gray-400 hover:text-white transition">
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
              <p>© 2026 PointsPath Canada • Built with ❤️ for the Canadian travel hacking community</p>
              <p className="mt-2">
                Educational tool only. Not financial advice. Points estimates may vary. 
                Always verify offers on issuer websites.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // TRIP CALCULATOR VIEW
  // ============================================================================
  
  if (currentView === 'trip') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center">
                <Plane className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Plan Your Trip</h2>
                <p className="text-gray-600">Calculate points needed for your journey</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Points shown are ONE-WAY estimates. Always verify on Aeroplan.com before booking.
              </p>
            </div>

            {tripError && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{tripError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCalculatePoints} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    From City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.from_city}
                    onChange={(e) => {
                      setFormData({...formData, from_city: e.target.value});
                      setFormErrors({...formErrors, from_city: null});
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.from_city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select departure city</option>
                    {Object.keys(CITIES_BY_REGION).map(region => (
                      <optgroup key={region} label={region}>
                        {CITIES_BY_REGION[region].map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {formErrors.from_city && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.from_city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    To City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.to_city}
                    onChange={(e) => {
                      setFormData({...formData, to_city: e.target.value});
                      setFormErrors({...formErrors, to_city: null});
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.to_city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select destination city</option>
                    {Object.keys(CITIES_BY_REGION).map(region => (
                      <optgroup key={region} label={region}>
                        {CITIES_BY_REGION[region].map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {formErrors.to_city && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.to_city}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Departure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.depart_date}
                    onChange={(e) => {
                      setFormData({...formData, depart_date: e.target.value});
                      setFormErrors({...formErrors, depart_date: null});
                    }}
                    min={today}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.depart_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.depart_date && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.depart_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Return Date <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                    min={formData.depart_date || today}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-1" />
                  Passengers
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Adults (12+)</label>
                    <select
                      value={formData.adults}
                      onChange={(e) => setFormData({...formData, adults: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {[0,1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Children (2-11)</label>
                    <select
                      value={formData.children}
                      onChange={(e) => setFormData({...formData, children: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {[0,1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-2">Infants (0-2)</label>
                    <select
                      value={formData.infants}
                      onChange={(e) => setFormData({...formData, infants: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {[0,1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {formErrors.passengers && (
                  <p className="text-red-500 text-xs mt-2">{formErrors.passengers}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Total: {parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants)} passengers (max 9)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travel Class</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'economy', label: 'Economy' },
                    { value: 'premium_economy', label: 'Premium Economy' },
                    { value: 'business', label: 'Business' },
                    { value: 'first', label: 'First' }
                  ].map(cls => (
                    <button
                      key={cls.value}
                      type="button"
                      onClick={() => setFormData({...formData, travel_class: cls.value})}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        formData.travel_class === cls.value
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Calculating...' : 'Calculate Points Required'}
              </button>
            </form>

            {tripResult && (
              <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">✨</span>
                  Your Trip Summary
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Route</p>
                    <p className="text-lg font-semibold text-gray-900">{tripResult.route}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Travel Class</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{tripResult.travel_class.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Passengers</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tripResult.passenger_breakdown.adults > 0 && `${tripResult.passenger_breakdown.adults} Adult(s)`}
                      {tripResult.passenger_breakdown.children > 0 && `, ${tripResult.passenger_breakdown.children} Child(ren)`}
                      {tripResult.passenger_breakdown.infants > 0 && `, ${tripResult.passenger_breakdown.infants} Infant(s)`}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-600">Points per Person (One-Way)</p>
                    <p className="text-lg font-semibold text-gray-900">{tripResult.points_per_person.toLocaleString()} points</p>
                  </div>

                  <div className="border-t-2 border-indigo-200 pt-3 mt-3">
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-semibold">One-Way Trip:</span>
                        <span className="font-bold text-2xl text-indigo-600">{tripResult.total_points.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {tripResult.points_per_person.toLocaleString()} pts × {parseInt(formData.adults) + parseInt(formData.children) + parseInt(formData.infants)} passengers
                      </p>
                    </div>

                    {tripResult.is_round_trip ? (
                      <div className="bg-purple-600 text-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Round-Trip Total:</span>
                          <span className="font-bold text-3xl">{(tripResult.total_points * 2).toLocaleString()}</span>
                        </div>
                        <p className="text-sm opacity-90">
                          {tripResult.total_points.toLocaleString()} points each way × 2
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Round-trip estimate:</strong> {(tripResult.total_points * 2).toLocaleString()} points
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> These are ONE-WAY estimates. Actual pricing varies ±50-200%. Always verify on Aeroplan.com.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // POINTS GAP VIEW
  // ============================================================================
  
  if (currentView === 'gap') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Bridge Your Points Gap</h2>
                <p className="text-gray-600">Get personalized strategies to reach your travel goals</p>
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>How it works:</strong> Enter points needed, select cards, and we'll show personalized spending strategies.
              </p>
            </div>

            {gapError && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{gapError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCalculateGap} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Points Needed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={gapFormData.points_needed}
                    onChange={(e) => {
                      setGapFormData({...gapFormData, points_needed: e.target.value});
                      setGapFormErrors({...gapFormErrors, points_needed: null});
                    }}
                    placeholder="e.g., 100000"
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      gapFormErrors.points_needed ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {gapFormErrors.points_needed && (
                    <p className="text-red-500 text-xs mt-1">{gapFormErrors.points_needed}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Current Points Balance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={gapFormData.points_current}
                    onChange={(e) => {
                      setGapFormData({...gapFormData, points_current: e.target.value});
                      setGapFormErrors({...gapFormErrors, points_current: null});
                    }}
                    placeholder="e.g., 25000"
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                      gapFormErrors.points_current ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {gapFormErrors.points_current && (
                    <p className="text-red-500 text-xs mt-1">{gapFormErrors.points_current}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline: {gapFormData.timeline_months} months
                </label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={gapFormData.timeline_months}
                  onChange={(e) => setGapFormData({...gapFormData, timeline_months: e.target.value})}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(gapFormData.timeline_months / 24) * 100}%, #e9d5ff ${(gapFormData.timeline_months / 24) * 100}%, #e9d5ff 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 month</span>
                  <span>24 months</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Budget <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={gapFormData.monthly_budget}
                  onChange={(e) => setGapFormData({...gapFormData, monthly_budget: e.target.value})}
                  placeholder="Leave empty to auto-calculate required spend"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">We'll calculate required monthly spend if left empty</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Select Cards to Compare <span className="text-red-500">*</span> (Choose 1-5)
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Selected: <span className="font-semibold text-purple-600">{selectedCards.length} of 5 cards</span>
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {cards.map(card => (
                      <label
                        key={card.id}
                        className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                          selectedCards.includes(card.id)
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                        } ${selectedCards.length >= 5 && !selectedCards.includes(card.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCards.includes(card.id)}
                          onChange={() => handleCardSelection(card.id)}
                          disabled={selectedCards.length >= 5 && !selectedCards.includes(card.id)}
                          className="mt-1 mr-3 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 leading-tight">{card.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {card.welcome_bonus.toLocaleString()} pts • ${card.annual_fee}/yr
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {gapFormErrors.cards && (
                    <p className="text-red-500 text-xs mt-2">{gapFormErrors.cards}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedCards.length === 0}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Calculating...' : selectedCards.length === 0 ? 'Select at least 1 card' : 'Calculate My Strategy'}
              </button>
            </form>

            {gapResults && (
              <div className="mt-8 space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Your Strategy Summary
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-sm text-gray-600">Points Gap</div>
                      <div className="text-2xl font-bold text-gray-900">{gapResults.points_gap.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-sm text-gray-600">Timeline</div>
                      <div className="text-2xl font-bold text-gray-900">{gapResults.timeline_months} months</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="text-sm text-gray-600">Monthly Target</div>
                      <div className="text-2xl font-bold text-gray-900">{gapResults.monthly_points_target.toLocaleString()} pts</div>
                    </div>
                  </div>

                  {gapResults.budget_status && (
                    <div className="mt-4 bg-white rounded-lg p-4 shadow">
                      <p className="text-lg font-semibold text-gray-900">{gapResults.budget_status}</p>
                      {gapResults.calculated_budget && (
                        <p className="text-sm text-gray-600 mt-2">
                          Recommended monthly spending: ${gapResults.calculated_budget.toLocaleString()}/month
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recommended Strategies (Best First)</h3>
                  <div className="space-y-4">
                    {gapResults.strategies.map((strategy, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-100 hover:border-purple-300 transition">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900">{strategy.card_name}</h4>
                            <p className="text-sm text-gray-500 mt-1">Average Earn Rate: <span className="font-semibold text-purple-600">{strategy.avg_earn_rate}x</span></p>
                          </div>
                          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold ml-4">
                            #{index + 1}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                            <div className="text-xs text-gray-600">Monthly Spend</div>
                            <div className="text-lg font-bold text-gray-900">${strategy.monthly_spend_needed.toLocaleString()}</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                            <div className="text-xs text-gray-600">Total Spend</div>
                            <div className="text-lg font-bold text-gray-900">${strategy.total_spend_needed.toLocaleString()}</div>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
                            <div className="text-xs text-gray-600">Monthly Points</div>
                            <div className="text-lg font-bold text-gray-900">{strategy.monthly_points_earned.toLocaleString()}</div>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3">
                            <div className="text-xs text-gray-600">Total Points</div>
                            <div className="text-lg font-bold text-gray-900">{strategy.total_points_earned.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h5 className="font-semibold text-gray-900 mb-3">Spending Breakdown:</h5>
                          <div className="space-y-2">
                            {strategy.category_breakdown.map((cat, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{cat.category}</span>
                                  <span className="text-sm bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-semibold">{cat.multiplier}x</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">${cat.monthly_spend.toLocaleString()}/mo</div>
                                  <div className="text-sm text-gray-600">= {cat.monthly_points.toLocaleString()} pts</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {strategy.budget_warning && (
                          <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-3">
                            <p className="text-sm text-yellow-800">{strategy.budget_warning}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default App;