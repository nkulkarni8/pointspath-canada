import React, { useState, useEffect, useCallback } from 'react';
import { Plane, CreditCard, TrendingUp, Calendar, Users, MapPin, AlertCircle, Loader2, Target, Calculator } from 'lucide-react';
import { API_URL } from './config';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PointsOptimizer = () => {
  const [selectedFlow, setSelectedFlow] = useState(null);
  
  const [tripFormData, setTripFormData] = useState({
    from_city: 'Toronto',
    to_city: 'London',
    depart_date: '',
    return_date: '',
    passengers: 1,
    travel_class: 'economy'
  });
  
  const [gapFormData, setGapFormData] = useState({
    points_needed: '',
    points_current: '',
    timeline_months: 6,
    selected_cards: [],
    monthly_budget: ''
  });
  
  const [results, setResults] = useState(null);
  const [cards, setCards] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cards`);
      if (!response.ok) throw new Error('Failed to fetch cards');
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Could not load credit cards. Make sure backend is running on ' + API_BASE_URL);
    }
  };

  const calculateTripPoints = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pointsResponse = await fetch(`${API_BASE_URL}/calculate-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripFormData)
      });
      
      if (!pointsResponse.ok) {
        const errorData = await pointsResponse.json();
        throw new Error(errorData.detail || 'Failed to calculate points');
      }
      
      const pointsData = await pointsResponse.json();
      
      const strategiesResponse = await fetch(`${API_BASE_URL}/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripFormData)
      });
      
      if (!strategiesResponse.ok) {
        throw new Error('Failed to fetch strategies');
      }
      
      const strategiesData = await strategiesResponse.json();
      
      setResults(pointsData);
      setStrategies(strategiesData);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePointsGap = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the backend API for detailed calculation
      const response = await fetch(`${API_BASE_URL}/calculate-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_needed: parseInt(gapFormData.points_needed),
          points_current: parseInt(gapFormData.points_current || 0),
          timeline_months: parseInt(gapFormData.timeline_months),
          card_ids: gapFormData.selected_cards.map(id => parseInt(id)),
          monthly_budget: gapFormData.monthly_budget ? parseInt(gapFormData.monthly_budget) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate gap');
      }

      const data = await response.json();
      
      setResults({
        type: 'gap',
        pointsGap: data.points_gap,
        monthlyTarget: data.monthly_points_target,
        timeline: data.timeline_months,
        strategies: data.strategies,
        achievable: data.is_achievable,
        totalMonthlySpend: data.total_monthly_spend
      });
      
    } catch (err) {
      setError(err.message || 'Please fill in all required fields');
    } finally {
      setLoading(false);
    }
  };

  if (selectedFlow === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 pt-8">
            <div className="flex items-center justify-center mb-4">
              <Plane className="w-12 h-12 text-indigo-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-800">Points Optimizer Canada</h1>
            </div>
            <p className="text-gray-600 text-lg mb-2">Choose how you'd like to plan your points strategy</p>
            <div className="text-sm text-gray-500">
              🎯 Connected to: {API_BASE_URL}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg shadow max-w-3xl mx-auto">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 px-4">
            <div 
              onClick={() => setSelectedFlow('trip')}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500 group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6 group-hover:bg-indigo-200 transition-colors">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Plan a Trip</h2>
              <p className="text-gray-600 mb-6">
                Know where you want to go? Calculate how many points you need and get smart earning strategies.
              </p>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Calculate points for specific routes</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Compare different travel classes</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Get personalized earning strategies</span>
                </div>
              </div>
              
              <button className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Start Planning Trip →
              </button>
            </div>

            <div 
              onClick={() => setSelectedFlow('gap')}
              className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6 group-hover:bg-purple-200 transition-colors">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Calculate Points Gap</h2>
              <p className="text-gray-600 mb-6">
                Already know how many points you need? Find out exactly how to earn them with your cards.
              </p>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Set your points target and timeline</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Use your existing credit cards</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Get month-by-month spending plan</span>
                </div>
              </div>
              
              <button className="mt-8 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Calculate My Gap →
              </button>
            </div>
          </div>

          <div className="text-center mt-12 pb-8 text-gray-500 text-sm">
            <p className="mb-2">
              {cards.length > 0 ? '✅' : '⏳'} Backend API {cards.length > 0 ? 'Connected' : 'Loading...'} | 
              🎯 Real-time calculations | 
              🇨🇦 Made for Canadians
            </p>
            <p className="text-xs text-gray-400 mt-3 max-w-3xl mx-auto">
              <strong>Data Accuracy:</strong> Credit card offers and earning rates updated January 2026. 
              Flight points are estimates based on typical Aeroplan pricing. This tool is for educational 
              purposes only and not financial advice. Always verify current offers on official bank and 
              airline websites.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFlow === 'gap') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 pt-8">
            <button 
              onClick={() => {
                setSelectedFlow(null);
                setResults(null);
              }}
              className="text-purple-600 hover:text-purple-800 flex items-center"
            >
              ← Back to Home
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Calculate Your Points Gap</h2>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <p className="text-green-800 text-sm">
                ✅ <strong>Using real credit card data!</strong> All card bonuses and earning rates are current as of January 2026. Enter your exact points requirement from the airline website for accurate earning strategies.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 mr-2 text-purple-600" />
                  How many points do you need?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 80000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={gapFormData.points_needed}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setGapFormData(prev => ({...prev, points_needed: value}));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Found this from an airline website or booking tool</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                  How many points do you currently have?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 25000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={gapFormData.points_current}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setGapFormData(prev => ({...prev, points_current: value}));
                  }}
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Timeline (months)
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={gapFormData.timeline_months}
                  onChange={(e) => setGapFormData(prev => ({...prev, timeline_months: e.target.value}))}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12,15,18,24].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'month' : 'months'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 mr-2 text-purple-600" />
                  Which credit cards do you have? (Select all that apply)
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {cards.map(card => (
                    <label key={card.id} className="flex items-center py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        value={card.id}
                        checked={gapFormData.selected_cards.includes(card.id.toString())}
                        onChange={(e) => {
                          const cardId = e.target.value;
                          setGapFormData(prev => ({
                            ...prev,
                            selected_cards: e.target.checked
                              ? [...prev.selected_cards, cardId]
                              : prev.selected_cards.filter(id => id !== cardId)
                          }));
                        }}
                      />
                      <span className="text-sm text-gray-700">{card.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calculator className="w-4 h-4 mr-2 text-purple-600" />
                  Monthly spending budget (optional)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g., 3000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={gapFormData.monthly_budget}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setGapFormData(prev => ({...prev, monthly_budget: value}));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">We'll check if the plan fits your budget</p>
              </div>
            </div>

            <button
              onClick={calculatePointsGap}
              disabled={loading || !gapFormData.points_needed || gapFormData.selected_cards.length === 0}
              className="w-full mt-8 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate My Spending Plan
                </>
              )}
            </button>
          </div>

          {results && results.type === 'gap' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Points Plan</h3>
                
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
                  <p className="text-green-800 text-xs">
                    ✅ <strong>Accurate calculations</strong> based on real credit card earning rates (updated January 2026). Strategies assume typical spending patterns in bonus categories.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-purple-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Points Gap</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {results.pointsGap.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">points to earn</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Monthly Target</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {results.monthlyTarget.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">points/month</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Timeline</p>
                    <p className="text-3xl font-bold text-green-600">
                      {results.timeline}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">months</p>
                  </div>
                </div>

                {results.achievable === false && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ The required spending exceeds your monthly budget. Consider extending your timeline or getting additional cards.
                    </p>
                  </div>
                )}

                <h4 className="text-xl font-bold text-gray-800 mb-4">Recommended Spending Strategy</h4>
                
                {results.strategies.map((strategy, idx) => (
                  <div key={idx} className="border-2 border-purple-100 rounded-xl p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                      <h5 className="text-lg font-semibold text-gray-800">{strategy.card_name}</h5>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        Avg: {strategy.avg_earn_rate}x points
                      </span>
                    </div>
                    
                    {/* Category Breakdown */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        💡 <strong>How to Maximize Points:</strong> Spend strategically in these categories
                      </p>
                      <div className="space-y-3">
                        {strategy.category_breakdown.map((cat, catIdx) => (
                          <div key={catIdx} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                  {cat.category === 'Groceries' ? '🛒' : 
                                   cat.category === 'Dining' ? '🍽️' : 
                                   cat.category === 'Gas' ? '⛽' : 
                                   cat.category === 'Travel' ? '✈️' : 
                                   cat.category === 'Entertainment' ? '🎬' : 
                                   cat.category === 'Transit' ? '🚇' : 
                                   cat.category === 'Air Canada' ? '🛫' : '💳'}
                                </span>
                                <div>
                                  <p className="font-semibold text-gray-800">{cat.category}</p>
                                  <p className="text-xs text-gray-600">
                                    {cat.multiplier}x earn rate
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">
                                  ${cat.monthly_spend.toLocaleString()}<span className="text-sm text-gray-500">/mo</span>
                                </p>
                                <p className="text-xs text-green-600 font-medium">
                                  +{cat.monthly_points.toLocaleString()} pts/mo
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Monthly Spend Total</p>
                        <p className="text-xl font-bold text-gray-800">${strategy.monthly_spend_needed.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Total Over {results.timeline}mo</p>
                        <p className="text-xl font-bold text-gray-800">${strategy.total_spend_needed.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Total Points Earned</p>
                        <p className="text-xl font-bold text-green-600">{strategy.total_points_earned.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800 font-semibold flex items-center">
                    <span className="mr-2">✅</span>
                    You'll reach your {gapFormData.points_needed} points goal in {results.timeline} months!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Trip planning flow...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 pt-8">
          <button 
            onClick={() => {
              setSelectedFlow(null);
              setResults(null);
            }}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Plan Your Trip</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <p className="text-blue-800 text-sm">
              ℹ️ <strong>Points estimates</strong> are based on typical Aeroplan award pricing as of January 2026. Actual redemption costs may vary based on availability, dates, and dynamic pricing. Always verify on Aeroplan.com before booking.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                From City
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.from_city}
                onChange={(e) => setTripFormData({...tripFormData, from_city: e.target.value})}
              >
                <option value="Toronto">Toronto</option>
                <option value="Vancouver">Vancouver</option>
                <option value="Montreal">Montreal</option>
                <option value="Calgary">Calgary</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 mr-2 text-indigo-600" />
                To City
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.to_city}
                onChange={(e) => setTripFormData({...tripFormData, to_city: e.target.value})}
              >
                <option value="London">London</option>
                <option value="Paris">Paris</option>
                <option value="Tokyo">Tokyo</option>
                <option value="New York">New York</option>
                <option value="Vancouver">Vancouver</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                Departure Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.depart_date}
                onChange={(e) => setTripFormData({...tripFormData, depart_date: e.target.value})}
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                Return Date (Optional)
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.return_date}
                onChange={(e) => setTripFormData({...tripFormData, return_date: e.target.value})}
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 mr-2 text-indigo-600" />
                Passengers
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.passengers}
                onChange={(e) => setTripFormData({...tripFormData, passengers: parseInt(e.target.value)})}
              >
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Plane className="w-4 h-4 mr-2 text-indigo-600" />
                Travel Class
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tripFormData.travel_class}
                onChange={(e) => setTripFormData({...tripFormData, travel_class: e.target.value})}
              >
                <option value="economy">Economy</option>
                <option value="premium_economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>

          <button
            onClick={calculateTripPoints}
            disabled={loading}
            className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" />
                Calculate Points & Get Strategy
              </>
            )}
          </button>
        </div>

        {results && results.total_points && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Points Required</h3>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
                <p className="text-yellow-800 text-xs">
                  💡 These are estimated points based on typical Aeroplan pricing. Check Aeroplan.com for exact availability and pricing for your travel dates.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Total Points Needed</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {results.total_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    for {tripFormData.passengers} {tripFormData.passengers === 1 ? 'passenger' : 'passengers'}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Per Passenger</p>
                  <p className="text-3xl font-bold text-green-600">
                    {results.points_per_person.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">points each way</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Travel Class</p>
                  <p className="text-3xl font-bold text-purple-600 capitalize">
                    {results.travel_class.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {tripFormData.from_city} → {tripFormData.to_city}
                  </p>
                </div>
              </div>
            </div>

            {strategies.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3 text-indigo-600" />
                  Smart Earning Strategies
                </h3>
                
                {strategies.map((strategy, idx) => (
                  <div key={idx} className="border-2 border-indigo-100 rounded-xl p-6 mb-4 hover:border-indigo-300 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">
                          Strategy {idx + 1}: {strategy.cards.join(' + ')}
                        </h4>
                        <p className="text-gray-600 text-sm">{strategy.description}</p>
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ml-4">
                        ~{strategy.months_needed} {strategy.months_needed === 1 ? 'month' : 'months'}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Monthly Spend</p>
                        <p className="text-xl font-bold text-gray-800">${strategy.monthly_spend.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Total Spend Needed</p>
                        <p className="text-xl font-bold text-gray-800">${strategy.total_spend.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">Avg. Earn Rate</p>
                        <p className="text-xl font-bold text-gray-800">{strategy.earn_rate}x points</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cards.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Recommended Credit Cards</h3>
                
                <div className="space-y-4">
                  {cards.slice(0, 5).map((card, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all hover:border-indigo-200">
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="flex-1 min-w-[250px]">
                          <h4 className="font-semibold text-lg text-gray-800 mb-2">{card.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">{card.earn_rate}</p>
                          <div className="flex gap-4 text-sm flex-wrap">
                            <span className="text-green-600 font-medium">
                              ✨ Bonus: {card.welcome_bonus.toLocaleString()} pts
                            </span>
                            <span className="text-gray-500">
                              💳 Fee: ${card.annual_fee}/year
                            </span>
                            <span className="text-indigo-600 font-medium">
                              🎯 {card.program}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-12 pb-8 text-gray-500 text-sm">
          <p className="text-xs text-gray-400 mt-2">
            Points Optimizer Canada - v2.0 | Free & Open Source
          </p>
        </div>
      </div>
    </div>
  );
};

export default PointsOptimizer;