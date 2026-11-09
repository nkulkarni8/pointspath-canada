import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// ── Google Analytics 4 ────────────────────────────────────────────────────────
// Set VITE_GA_MEASUREMENT_ID to enable. Measurement ID comes from
// Google Analytics → Admin → Data Streams.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
if (GA_ID && typeof document !== 'undefined') {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, {
    page_path: window.location.pathname,
    custom_map: { dimension1: 'country', dimension2: 'user_type' },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
