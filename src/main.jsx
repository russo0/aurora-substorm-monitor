import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import appStyles from './index.css?inline'
import App from './App.jsx'

const styleId = 'aurora-monitor-styles'
if (!document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = appStyles
  document.head.appendChild(style)
}

// Força o desregistro de qualquer Service Worker/PWA antigo que esteja servindo cache velho
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
