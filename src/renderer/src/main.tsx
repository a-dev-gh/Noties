import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'

// Catch and display any uncaught errors to help debug white screen issues
window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<pre style="color:red;padding:20px;">RENDER ERROR:\n${msg}\n${src}:${line}:${col}\n${err?.stack || ''}</pre>`
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
