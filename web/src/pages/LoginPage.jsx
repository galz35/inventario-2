import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Boxes, Activity } from 'lucide-react';

const LoginPage = () => {
  useEffect(() => {
    // Redirección automática al Portal Central (única fuente de identidad)
    console.log("[Portal Auth] Redirigiendo al servidor de identidad corporativa...");
    const ssoReturnUrl = `${window.location.origin}/auth/sso`;
    window.location.href = `http://localhost:5173/login-empleado?returnUrl=${encodeURIComponent(ssoReturnUrl)}`;
  }, []);

  return (
    <div className="login-page">
      <div className="login-bg">
         <div className="gradient-sphere sphere-1"></div>
         <div className="gradient-sphere sphere-2"></div>
         <div className="grid-overlay"></div>
      </div>

      <div className="login-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="login-card"
        >
          <div className="login-header">
            <div className="brand-badge">
              <Boxes size={32} color="#fff" />
            </div>
            <h1>Inventario Pro</h1>
            <div className="status-pill">
              <Activity size={12} className="pulse-icon" />
              <span>SISTEMA CENTRALIZADO</span>
            </div>
          </div>

          <div className="auth-handoff">
            <div className="handoff-box">
              <ShieldCheck size={24} className="text-red-500" />
              <p>Sincronizando con Portal Central de Claro...</p>
            </div>
            
            <div className="loading-state">
              <Loader2 className="spin" />
              <span>Validando su identidad corporativa</span>
            </div>
          </div>

          <footer className="login-footer">
            <p>© 2026 Claro Nicaragua · Dirección de Tecnología</p>
          </footer>
        </motion.div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap');

        .login-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0F172A;
          overflow: hidden;
          position: relative;
          font-family: 'Outfit', sans-serif;
        }

        .login-bg { position: absolute; inset: 0; z-index: 0; }
        .grid-overlay {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .gradient-sphere {
          position: absolute; width: 800px; height: 800px;
          filter: blur(120px); border-radius: 50%; opacity: 0.15;
        }
        .sphere-1 { top: -200px; right: -100px; background: #DA291C; }
        .sphere-2 { bottom: -200px; left: -100px; background: #3B82F6; }

        .login-container { position: relative; z-index: 10; width: 100%; max-width: 480px; padding: 24px; }

        .login-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          padding: 60px;
          border-radius: 40px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }

        .brand-badge {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #DA291C 0%, #a51d14 100%);
          border-radius: 22px; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; box-shadow: 0 12px 24px rgba(218, 41, 28, 0.3);
        }

        h1 { font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 12px; }

        .status-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255, 255, 255, 0.05); padding: 6px 16px;
          border-radius: 99px; border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8; font-size: 11px; font-weight: 700;
        }

        .auth-handoff { margin-top: 40px; display: flex; flex-direction: column; gap: 24px; }

        .handoff-box {
          background: rgba(255, 255, 255, 0.03);
          padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center; gap: 12px;
          color: #E2E8F0; font-size: 14px; font-weight: 500;
        }

        .loading-state {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          color: #DA291C; font-weight: 700; font-size: 13px; text-transform: uppercase;
          letter-spacing: 1px;
        }

        .login-footer { margin-top: 48px; font-size: 12px; color: #475569; font-weight: 600; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .pulse-icon {
          color: #DA291C;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
