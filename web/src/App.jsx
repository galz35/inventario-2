import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import SSOHandler from './pages/SSOHandler';

function App() {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!initialized) return null;

  return (
    <Router>
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
    </Router>
  );
}

export default App;
