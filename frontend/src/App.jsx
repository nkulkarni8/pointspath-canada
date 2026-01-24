import React, { useState, useEffect } from 'react';
import { Plane, Calculator, ArrowLeft, MapPin, Calendar, Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { API_URL } from './config';

function App() {
  // Navigation state
  const [currentView, setCurrentView] = useState('home'); // 'home', 'trip', 'gap'
  
  // Flow 1: Trip Planning State
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelClass, setTravelClass] = useState('economy');
  const [tripResult, setTripResult] = useState(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  
  // Flow 2: Points Gap State
  const [pointsNeeded, setPointsNeeded] = useState('');
  const [pointsCurrent, setPointsCurrent] = useState('');
  const [timeline, setTimeline] = useState(6);
  const [selectedCards, setSelectedCards] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [gapResult, setGapResult] = useState(null);
  
  // Shared state
  const [cards, setCards] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Available cities for dropdown (extracted from routes)
  const CANADIAN_CITIES = [
    'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Halifax'
  ];

  const NORTH_AMERICAN_CITIES = [
    'New York', 'Los Angeles', 'San Francisco', 'Boston', 'Miami', 'Cancun', 'Mexico City'
  ];

  const INTERNATIONAL_CITIES = [
    'London', 'Paris', 'Frankfurt', 'Rome', 'Amsterdam',
    'Tokyo', 'Hong Kong', 'Seoul', 'Singapore',
    'Dubai', 'Tel Aviv',
    'Sydney', 'Auckland',
    'Sao Paulo', 'Buenos Aires',
    'Barbados', 'Jamaica'
  ];

  const ALL_CITIES = [
    ...CANADIAN_CITIES,
    ...NORTH_AMERICAN_CITIES,
    ...INTERNATIONAL_CITIES
  ].sort();

  // Load cards and routes on mount
  useEffect(() => {
    loadCards();
    loadRoutes();
  }, []);

  const loadCards = async () => {
    try {
      const response = await fetch(`${API_URL}/cards`);
      if (!response.ok) throw new Error('Failed to load cards');
      const data = await response.json();
      setCards(data.cards || data);
    } catch (err) {
      console.error('Error loading cards:', err);
      setError(`Could not load credit cards. Make sure backend is running on ${API_URL}`);
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await fetch(`${API_URL}/routes`);
      if (!response.ok) throw new Error('Failed to load routes');
      const data = await response.json();
      setRoutes(data.routes || data);
    } catch (err) {
      console.error('Error loading routes:', err);
    }
  };

  // Reset all form data when changing views
  const resetForms = () => {
    // Flow 1 reset
    setFromCity('');
    setToCity('');
    setDepartDate('');
    setReturnDate('');
    setAdults(1);
    setChildren(0);
    setTravelClass('economy');
    setTripResult(null);
    setIsRoundTrip(false);
    
    // Flow 2 reset
    setPointsNeeded('');
    setPointsCurrent('');
    setTimeline(6);
    setSelectedCards([]);
    setMonthlyBudget('');
    setGapResult(null);
    
    // Clear errors
    setError(null);
    setFormErrors({});
  };

  const navigateTo = (view) => {
    resetForms();
    setCurrentView(view);
  };

  // Flow 1: Validate Trip Form
  const validateTripForm = () => {
    const errors = {};
    
    if (!fromCity) {
      errors.fromCity = 'Origin city is required';
    }
    
    if (!toCity) {
      errors.toCity = 'Destination city is required';
    }
    
    if (fromCity === toCity) {
      errors.toCity = 'Destination must be different from origin';
    }
    
    if (!departDate) {
      errors.departDate = 'Departure date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const depart = new Date(departDate);
      
      if (depart < today) {
        errors.departDate = 'Departure date must be in the future';
      }
    }
    
    // Validate return date if provided
    if (returnDate) {
      const depart = new Date(departDate);
      const ret = new Date(returnDate);
      
      if (ret < depart) {
        errors.returnDate = 'Return date must be after departure date';
      }
    }
    
    const totalPassengers = adults + children;
    if (totalPassengers < 1 || totalPassengers > 9) {
      errors.passengers = 'Total passengers must be between 1 and 9';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Flow 1: Calculate Points
  const calculatePoints = async (e) => {
    e.preventDefault();
    
    if (!validateTripForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const totalPassengers = adults + children;
      
      const response = await fetch(`${API_URL}/calculate-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: fromCity,
          to_city: toCity,
          depart_date: departDate,
          return_date: returnDate || null,
          passengers: totalPassengers,
          travel_class: travelClass
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate points');
      }
      
      const data = await response.json();
      setTripResult(data);
      setIsRoundTrip(!!returnDate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Flow 2: Validate Gap Form
  const validateGapForm = () => {
    const errors = {};
    
    if (!pointsNeeded || pointsNeeded <= 0) {
      errors.pointsNeeded = 'Points needed must be greater than 0';
    }
    
    if (!pointsCurrent || pointsCurrent < 0) {
      errors.pointsCurrent = 'Current points must be 0 or greater';
    }
    
    if (pointsCurrent >= pointsNeeded) {
      errors.pointsCurrent = 'Current points must be less than points needed';
    }
    
    if (selectedCards.length === 0) {
      errors.selectedCards = 'Please select at least one credit card';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Flow 2: Calculate Gap
  const calculateGap = async (e) => {
    e.preventDefault();
    
    if (!validateGapForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/calculate-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_needed: parseInt(pointsNeeded),
          points_current: parseInt(pointsCurrent),
          timeline_months: timeline,
          card_ids: selectedCards,
          monthly_budget: monthlyBudget ? parseInt(monthlyBudget) : null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate gap');
      }
      
      const data = await response.json();
      setGapResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle card selection
  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

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
              {/* Canada Flag - Using red box with maple leaf */}
              <div className="bg-red-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-lg" style={{ fontSize: '2rem' }}>
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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Maximize Your Credit Card Points
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Calculate points needed for your dream trip and discover how to earn them with your Canadian credit cards
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-2">Important Disclaimers:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Points estimates</strong> based on typical Aeroplan pricing (January 2026) - actual prices vary by date and availability</li>
                  <li><strong>Welcome bonuses change monthly</strong> - always verify current offers on official bank websites</li>
                  <li><strong>Educational tool only</strong> - not financial or investment advice</li>
                  <li><strong>Data freshness:</strong> Card offers updated January 2026</li>
                  <li><strong>Always confirm</strong> points requirements on airline websites before booking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Flow 1: Trip Planning */}
            <button
              onClick={() => navigateTo('trip')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-indigo-500"
            >
              <div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Plane className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Plan a Trip</h3>
              <p className="text-gray-600 mb-4">
                Calculate how many points you need for your next adventure. Select your route, travel dates, and class to get instant results.
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                Start Planning
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>

            {/* Flow 2: Points Gap */}
            <button
              onClick={() => navigateTo('gap')}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-purple-500"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Calculate Points Gap</h3>
              <p className="text-gray-600 mb-4">
                Found the perfect flight? Enter the points needed and we'll show you exactly how to earn them with your credit cards.
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 gap-2 transition-all">
                Calculate Strategy
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">22</div>
              <div className="text-gray-600">Canadian Credit Cards</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">242</div>
              <div className="text-gray-600">Popular Routes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">Free</div>
              <div className="text-gray-600">Always Free to Use</div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm">
            <p className="mb-2">© 2026 PointsPath Canada • Not affiliated with any bank or credit card issuer</p>
            <p className="text-gray-500">Built with ❤️ for the Canadian travel hacking community</p>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // FLOW 1: TRIP PLANNING VIEW
  // ============================================================================
  
  if (currentView === 'trip') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
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

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Points shown are ONE-WAY estimates based on typical Aeroplan pricing. 
                Always verify on airline websites before booking.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={calculatePoints} className="space-y-6">
              {/* Route - Dropdown */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    From
                  </label>
                  <select
                    value={fromCity}
                    onChange={(e) => setFromCity(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.fromCity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select origin city</option>
                    <optgroup label="Canada">
                      {CANADIAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                    <optgroup label="North America">
                      {NORTH_AMERICAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                    <optgroup label="International">
                      {INTERNATIONAL_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  </select>
                  {formErrors.fromCity && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.fromCity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    To
                  </label>
                  <select
                    value={toCity}
                    onChange={(e) => setToCity(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.toCity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select destination city</option>
                    <optgroup label="Canada">
                      {CANADIAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                    <optgroup label="North America">
                      {NORTH_AMERICAN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                    <optgroup label="International">
                      {INTERNATIONAL_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  </select>
                  {formErrors.toCity && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.toCity}</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    min={getTodayDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.departDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.departDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.departDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Return Date <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departDate || getTodayDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      formErrors.returnDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.returnDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.returnDate}</p>
                  )}
                </div>
              </div>

              {/* Passengers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-1" />
                  Passengers
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Adults (18+)</label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Children (0-17)</label>
                    <select
                      value={children}
                      onChange={(e) => setChildren(parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {formErrors.passengers && (
                  <p className="text-red-500 text-sm mt-2">{formErrors.passengers}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Total passengers: {adults + children} (max 9)
                </p>
              </div>

              {/* Travel Class */}
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
                      onClick={() => setTravelClass(cls.value)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all ${
                        travelClass === cls.value
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculating...' : 'Calculate Points Required'}
              </button>
            </form>

            {/* Results */}
            {tripResult && (
              <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Points Required</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Route:</span>
                    <span className="font-semibold text-gray-900">{tripResult.route}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Travel Class:</span>
                    <span className="font-semibold text-gray-900 capitalize">{tripResult.travel_class.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Passengers:</span>
                    <span className="font-semibold text-gray-900">{adults + children}</span>
                  </div>
                  
                  <div className="border-t-2 border-indigo-200 pt-3 mt-3">
                    <div className="bg-white rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-semibold">One-Way Trip:</span>
                        <span className="font-bold text-2xl text-indigo-600">{tripResult.total_points.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {tripResult.points_per_person.toLocaleString()} points × {adults + children} passenger{adults + children > 1 ? 's' : ''}
                      </p>
                    </div>

                    {isRoundTrip && (
                      <div className="bg-purple-600 text-white rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">Round-Trip Total:</span>
                          <span className="font-bold text-3xl">{(tripResult.total_points * 2).toLocaleString()}</span>
                        </div>
                        <p className="text-sm opacity-90">
                          {tripResult.total_points.toLocaleString()} points each way × 2
                        </p>
                      </div>
                    )}

                    {!isRoundTrip && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-800">
                          💡 <strong>Round-trip estimate:</strong> {(tripResult.total_points * 2).toLocaleString()} points 
                          ({tripResult.total_points.toLocaleString()} × 2)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // FLOW 2: POINTS GAP VIEW
  // ============================================================================
  
  if (currentView === 'gap') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        {/* Header */}
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
                <h2 className="text-3xl font-bold text-gray-900">Calculate Points Gap</h2>
                <p className="text-gray-600">Find the perfect strategy to reach your goal</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>How it works:</strong> Enter the exact points you need, select your credit cards, 
                and we'll show you personalized spending strategies to bridge the gap.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={calculateGap} className="space-y-6">
              {/* Points Input */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Points Needed
                  </label>
                  <input
                    type="number"
                    value={pointsNeeded}
                    onChange={(e) => setPointsNeeded(e.target.value)}
                    placeholder="e.g., 80000"
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.pointsNeeded ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.pointsNeeded && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.pointsNeeded}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Current Points Balance
                  </label>
                  <input
                    type="number"
                    value={pointsCurrent}
                    onChange={(e) => setPointsCurrent(e.target.value)}
                    placeholder="e.g., 25000"
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      formErrors.pointsCurrent ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.pointsCurrent && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.pointsCurrent}</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline: {timeline} months
                </label>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={timeline}
                  onChange={(e) => setTimeline(parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 month</span>
                  <span>24 months</span>
                </div>
              </div>

              {/* Monthly Budget (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Budget <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="e.g., 4000"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set a monthly spending limit to check feasibility
                </p>
              </div>

              {/* Card Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Select Your Credit Cards
                </label>
                {formErrors.selectedCards && (
                  <p className="text-red-500 text-sm mb-2">{formErrors.selectedCards}</p>
                )}
                <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {cards.map(card => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => toggleCardSelection(card.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedCards.includes(card.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{card.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{card.issuer} • {card.program}</div>
                          <div className="text-xs text-purple-600 mt-1 font-medium">
                            Welcome: {card.welcome_bonus?.toLocaleString() || 0} pts
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedCards.includes(card.id)
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedCards.includes(card.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedCards.length} card{selectedCards.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculating...' : 'Calculate Strategy'}
              </button>
            </form>

            {/* Results - Show ALL selected cards */}
            {gapResult && (
              <div className="mt-8 space-y-6">
                {/* Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Strategy Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Points Gap</div>
                      <div className="text-3xl font-bold text-purple-600">{gapResult.points_gap.toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Monthly Target</div>
                      <div className="text-3xl font-bold text-pink-600">{gapResult.monthly_points_target.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">points/month</div>
                    </div>
                  </div>
                  {!gapResult.is_achievable && monthlyBudget && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ The required monthly spending exceeds your budget. Consider extending your timeline or selecting cards with higher earn rates.
                      </p>
                    </div>
                  )}
                </div>

                {/* Strategies - Show ALL cards */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">
                    Recommended Strategies ({gapResult.strategies.length} card{gapResult.strategies.length !== 1 ? 's' : ''})
                  </h4>
                  <div className="space-y-4">
                    {gapResult.strategies.map((strategy, index) => (
                      <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h5 className="font-bold text-lg text-gray-900">{strategy.card_name}</h5>
                            <p className="text-sm text-gray-600">Average earn rate: {strategy.avg_earn_rate}x</p>
                          </div>
                          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                            #{index + 1}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Monthly Spend</div>
                            <div className="text-xl font-bold text-gray-900">${strategy.monthly_spend_needed.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Total Spend</div>
                            <div className="text-xl font-bold text-gray-900">${strategy.total_spend_needed.toLocaleString()}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Points Earned</div>
                            <div className="text-xl font-bold text-purple-600">{strategy.total_points_earned.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Category Breakdown */}
                        {strategy.category_breakdown && strategy.category_breakdown.length > 0 && (
                          <div>
                            <div className="text-sm font-semibold text-gray-700 mb-2">Spending Breakdown:</div>
                            <div className="space-y-2">
                              {strategy.category_breakdown.map((cat, catIndex) => (
                                <div key={catIndex} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{cat.category}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-purple-600 font-medium">{cat.multiplier}x</span>
                                    <span className="text-gray-900 font-semibold">${cat.monthly_spend.toLocaleString()}/mo</span>
                                    <span className="text-gray-500">= {cat.monthly_points.toLocaleString()} pts</span>
                                  </div>
                                </div>
                              ))}
                            </div>
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