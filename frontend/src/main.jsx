// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'

// ── Google Analytics 4 ────────────────────────────────────────────────────────
// Add VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX to your .env file
// Get your Measurement ID from Google Analytics → Admin → Data Streams
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
if (GA_ID && typeof document !== 'undefined') {
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script1)

  window.dataLayer = window.dataLayer || []
  window.gtag = function() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    page_path: window.location.pathname,
    // Track custom dimensions
    custom_map: { dimension1: 'country', dimension2: 'user_type' }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
