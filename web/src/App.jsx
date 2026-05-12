import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SSOHandler from './pages/SSOHandler';
import { ToastProvider } from './components/Toast';

import { APP_BASE, API_BASE, PORTAL_URL } from './runtime';

function App() {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      if (window.location.pathname.includes('/auth/sso')) {
        setInitialized(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const payload = await response.json();
          if (payload.status === 'success' && payload.data) {
            if (!cancelled) {
              setUser(payload.data);
            }
          }
        }
      } catch (err) {
        console.warn('Session rehydration failed:', err);
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
    setUser(null);
    window.location.href = PORTAL_URL;
  };

  const basename = APP_BASE === "/" ? undefined : APP_BASE.replace(/\/$/, "");

  if (!initialized) return null;

  return (
    <Router basename={basename}>
      <ToastProvider>
      <Routes>
        {/* Ruta para capturar el SSO del Portal Central */}
        <Route 
          path="/auth/sso" 
          element={<SSOHandler onLoginSuccess={handleLoginSuccess} />} 
        />
        
        {/* Ruta de Login Manual */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} 
        />

        {/* Ruta Principal Protegida */}
        <Route 
          path="/" 
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
