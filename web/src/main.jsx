import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const CURRENT_V = 'CV_25_MAR_2026_SSO_SAFE';
console.log(`--- SYSTEM_VERSION: ${CURRENT_V} ---`);

const currentUrl = new URL(window.location.href);
const isSsoCallback =
    currentUrl.pathname.includes('/auth/sso') &&
    currentUrl.searchParams.has('token');

// Extreme cache kill but SSO safe
if (localStorage.getItem('SW_VERSION') !== CURRENT_V) {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (const registration of registrations) {
                registration.unregister();
                console.log('SW Unregistered for update');
            }
        });
    }

    localStorage.setItem('SW_VERSION', CURRENT_V);

    if (!isSsoCallback && currentUrl.searchParams.get('v') !== CURRENT_V) {
        currentUrl.searchParams.set('v', CURRENT_V);
        window.location.replace(
            `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
        );
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
