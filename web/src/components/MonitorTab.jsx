import React from 'react';
import { Clock, Truck, AlertTriangle, History } from 'lucide-react';

const MonitorTab = ({ stats, inventory }) => (
  <div className="dash-content animate-up">
    <div className="stats-grid">
      <div className="stat-card card">
        <div className="s-icon" style={{background: '#FEF3C7', color: '#B45309'}}><Clock size={20}/></div>
        <div className="s-val">
          <h3>{stats.pendientesAprobacion}</h3>
          <p>Para Aprobar</p>
        </div>
      </div>
      <div className="stat-card card">
        <div className="s-icon" style={{background: '#D1FAE5', color: '#047857'}}><Truck size={20}/></div>
        <div className="s-val">
          <h3>{stats.pendientesDespacho}</h3>
          <p>Para Despachar</p>
        </div>
      </div>
      <div className="stat-card card">
        <div className="s-icon" style={{background: '#FEE2E2', color: '#B91C1C'}}><AlertTriangle size={20}/></div>
        <div className="s-val">
          <h3>{stats.stockBajo}</h3>
          <p>Stock Crítico</p>
        </div>
      </div>
      <div className="stat-card card">
        <div className="s-icon" style={{background: '#DBEAFE', color: '#1D4ED8'}}><History size={20}/></div>
        <div className="s-val">
          <h3>{stats.movimientosHoy}</h3>
          <p>Movimientos Hoy</p>
        </div>
      </div>
    </div>

    <div className="two-cols">
      <div className="recent-card card">
        <div className="card-h">
          <h3>Stock Disponible</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead><tr><th>Artículo</th><th>Stock</th><th>Nivel</th></tr></thead>
            <tbody>
              {inventory.slice(0,5).map((item, idx)=>(
                <tr key={idx}>
                  <td><strong>{item.Nombre}</strong><br/><small>{item.Codigo}</small></td>
                  <td>{item.StockActual}</td>
                  <td><div className={`level-bar ${item.StockActual > item.StockMinimo ? 'ok' : 'low'}`} style={{width: Math.min(100, (item.StockActual/50)*100)+'%'}}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="info-card card">
        <div className="card-h"><h3>Estado del Módulo</h3></div>
        <div className="info-body">
          <div className="info-item"><div className="info-dot green"/><span>Sincronizado con Portal Central</span></div>
          <div className="info-item"><div className="info-dot green"/><span>Seguridad JWT Activa</span></div>
          <div className="info-item"><div className="info-dot amber"/><span>Última auditoría: Hace 2 horas</span></div>
        </div>
      </div>
    </div>
  </div>
);

export default MonitorTab;
