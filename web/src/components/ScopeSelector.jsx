import React from 'react';
import { Users, Globe, User } from 'lucide-react';

const SCOPES = [
  { id: 'PROPIAS', label: 'Mis Solicitudes', icon: User },
  { id: 'EQUIPO', label: 'Mi Equipo', icon: Users },
  { id: 'PAIS', label: 'País', icon: Globe },
  { id: 'TODO', label: 'Todos', icon: Globe },
];

const ScopeSelector = ({ value, onChange, user }) => {
  const roles = user?.roles || [];
  const allowedScopes = ['PROPIAS'];
  if (roles.includes('ADMIN')) allowedScopes.push('EQUIPO', 'PAIS', 'TODO');
  if (roles.includes('RRHH_APRUEBA')) allowedScopes.push('EQUIPO', 'PAIS');
  if (roles.includes('BODEGA')) allowedScopes.push('PAIS');

  const visible = SCOPES.filter(s => allowedScopes.includes(s.id));

  return (
    <div className="scope-selector">
      {visible.map(s => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            className={`scope-btn ${value === s.id ? 'active' : ''}`}
            onClick={() => onChange(s.id)}
          >
            <Icon size={14}/>
            <span>{s.label}</span>
          </button>
        );
      })}
      <style jsx>{`
        .scope-selector { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; }
        .scope-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; background: transparent; border-radius: 8px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
        .scope-btn.active { background: white; color: #DA291C; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .scope-btn:hover:not(.active) { color: #334155; }
      `}</style>
    </div>
  );
};

export default ScopeSelector;
