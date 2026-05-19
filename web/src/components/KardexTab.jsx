import React from 'react';
import { Search, ArrowUpRight, Send } from 'lucide-react';

const KardexTab = ({ kardex, kardexDesde, kardexHasta, onChangeDesde, onChangeHasta, onRefresh }) => (
  <div className="kardex-view animate-up">
    <div className="filters-bar card">
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input type="date" value={kardexDesde} onChange={e => onChangeDesde(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <span>a</span>
        <input type="date" value={kardexHasta} onChange={e => onChangeHasta(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button className="btn btn-primary" onClick={onRefresh}><Search size={16}/></button>
      </div>
    </div>
    <div className="card table-container">
      <table className="custom-table">
        <thead><tr><th>Fecha / Hora</th><th>Tipo</th><th>Artículo</th><th>Cantidad</th><th>Lote</th><th>Destino</th><th>Responsable</th></tr></thead>
        <tbody>
          {kardex.map((k,idx)=>(
            <tr key={idx}>
              <td>{new Date(k.Fecha).toLocaleString()}</td>
              <td>
                <span className={`type-tag ${k.Tipo?.toLowerCase()}`}>
                  {k.Tipo === 'ENTRADA' ? <ArrowUpRight size={12}/> : <Send size={12}/>}
                  {k.Tipo}
                </span>
              </td>
              <td><strong>{k.Nombre || k.ArticuloNombre}</strong></td>
              <td className="code-cell">{k.Cantidad}</td>
              <td><small>{k.LoteCodigo || '-'}</small></td>
              <td>{k.CarnetDestino || '-'}</td>
              <td>{k.CarnetResponsable}</td>
            </tr>
          ))}
          {kardex.length === 0 && <tr><td colSpan="7" style={{textAlign:'center', padding:'40px'}}>No hay movimientos en el período seleccionado.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

export default KardexTab;
