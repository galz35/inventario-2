import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const SSOHandler = ({ onLoginSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Verificando acceso centralizado...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Token de seguridad no detectado.');
      return;
    }

    const validateSSO = async () => {
      try {
        setStatus('Sincronizando sesión del Portal...');
        const response = await axios.post('/api/v1/auth/sso-login', { token });
        
        if (response.data.status === 'success') {
          setStatus('¡Acceso concedido! Preparando sistema...');
          onLoginSuccess(response.data.data);
          
          setTimeout(() => {
            navigate('/');
          }, 1200);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Fallo en la comunicación con el Portal.');
      }
    };

    validateSSO();
  }, [searchParams, onLoginSuccess, navigate]);

  return (
    <div className="sso-page">
      <div className="login-bg">
         <div className="blob blob-1"></div>
         <div className="blob blob-2"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sso-card"
      >
        <div className={`sso-icon ${error ? 'err' : ''}`}>
          {error ? <AlertCircle size={32} /> : <ShieldCheck size={32} />}
        </div>
        
        <h2>{error ? 'Fallo de Autenticación' : 'Iniciando Sesión'}</h2>
        <p className={error ? 'text-error' : 'text-dim'}>{error || status}</p>

        {!error && (
          <div className="loader-box">
             <div className="loading-bar">
                <motion.div 
                  className="bar-progress"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
             </div>
          </div>
        )}

        {error && (
          <button className="btn-back" onClick={() => navigate('/login')}>
            Volver al inicio manual
          </button>
        )}
      </motion.div>

      <style jsx>{`
        .sso-page {
          height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center;
          background: #F8FAFC; position: relative; overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .login-bg { position: absolute; inset: 0; z-index: 0; }
        .blob { position: absolute; width: 500px; height: 500px; border-radius: 50%; filter: blur(100px); }
        .blob-1 { top: -200px; right: -100px; background: rgba(218, 41, 28, 0.05); }
        .blob-2 { bottom: -200px; left: -100px; background: rgba(59, 130, 246, 0.05); }

        .sso-card {
          position: relative; z-index: 10; width: 100%; max-width: 380px; padding: 48px;
          background: #fff; border-radius: 32px; text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .sso-icon {
          width: 64px; height: 64px; background: rgba(218, 41, 28, 0.1); color: #DA291C;
          border-radius: 20px; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
        }
        .sso-icon.err { background: #fee2e2; color: #b91c1c; }
        
        h2 { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .text-dim { font-size: 14px; color: #64748b; font-weight: 500; }
        .text-error { font-size: 14px; color: #b91c1c; font-weight: 600; }

        .loader-box { width: 100%; margin-top: 32px; }
        .loading-bar { width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
        .bar-progress { width: 50%; height: 100%; background: #DA291C; border-radius: 3px; box-shadow: 0 0 10px rgba(218, 41, 28, 0.2); }

        .btn-back {
          margin-top: 32px; width: 100%; height: 48px; border-radius: 12px;
          border: 1px solid #e2e8f0; background: #fff; color: #0f172a;
          font-weight: 600; cursor: pointer; transition: 0.2s;
        }
        .btn-back:hover { background: #f8fafc; border-color: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default SSOHandler;
