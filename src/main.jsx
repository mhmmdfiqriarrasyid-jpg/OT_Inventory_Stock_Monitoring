import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Catch uncaught errors and show them on screen instead of a blank page
window.addEventListener('error', (e) => {
  document.getElementById('root').innerHTML = `
    <div style="padding:2rem;font-family:monospace;background:#fee2e2;color:#991b1b;min-height:100vh">
      <h2 style="margin:0 0 1rem">App Error</h2>
      <pre style="white-space:pre-wrap;font-size:13px">${e.message}\n\n${e.error?.stack ?? ''}</pre>
    </div>`
})

window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root').innerHTML = `
    <div style="padding:2rem;font-family:monospace;background:#fee2e2;color:#991b1b;min-height:100vh">
      <h2 style="margin:0 0 1rem">App Error (Promise)</h2>
      <pre style="white-space:pre-wrap;font-size:13px">${e.reason}</pre>
    </div>`
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
