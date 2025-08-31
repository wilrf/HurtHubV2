import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import '@/styles/globals.css'

// Error reporting (optional - can be configured later)
if (import.meta.env.PROD) {
  // Production error handling
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason)
    // Could integrate with Sentry or other error reporting here
  })

  window.addEventListener('error', event => {
    console.error('Global error:', event.error)
    // Could integrate with error reporting here
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)