import React, { useState } from 'react';

export default function EmailCapture() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('https://api.beehiiv.com/v2/publications/YOUR_PUB_ID/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_BEEHIIV_API_KEY}`
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'pointspath_canada',
          utm_medium: 'website'
        })
      });

      if (response.ok) {
        setStatus('success');
        setMessage('🎉 Success! Check your email to confirm.');
        setEmail('');
        
        // Track signup
        if (window.gtag) {
          window.gtag('event', 'email_signup', {
            'event_category': 'engagement',
            'event_label': 'newsletter'
          });
        }
      } else {
        throw new Error('Signup failed');
      }
    } catch (error) {
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
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
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