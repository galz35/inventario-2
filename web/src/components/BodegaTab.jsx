import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import api from '../api';

const BodegaTab = ({ selectedAlm, user, addToast }) => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [despachando, setDespachando] = useState(null);
  const [preDespacho, setPreDespacho] = useState(null);

  const refresh = async () => {
    try {
      const res = await api.get(`/bodega/pendientes?pais=${user.pais}`);
      setPendientes(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { refresh(); }, [user.pais]);

  const abrirPreDespacho = async (idSolicitud) => {
    setLoading(true);
    try {
      const res = await api.get(`/bodega/solicitudes/${idSolicitud}/pre-despacho?idAlmacen=${selectedAlm}`);
      setPreDespacho({ idSolicitud, lineas: res.data.data });
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al cargar pre-despacho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmarDespacho = async () => {
    if (!preDespacho) return;
    const lineas = preDespacho.lineas
      .filter(l => l.Pendiente > 0 && l.cantidadDespachar > 0)
      .map(l => ({ IdDetalle: l.IdDetalle, Entregar: parseInt(l.cantidadDespachar) || l.Pendiente }));
    if (lineas.length === 0) {
      addToast('Seleccione al menos una línea con cantidad > 0', 'error');
      return;
    }
    setDespachando(preDespacho.idSolicitud);
    try {
      await api.post('/bodega/despachar', { idAlmacen: selectedAlm, idSolicitud: preDespacho.idSolicitud, lineas });
      addToast('Despachado con éxito', 'success');
      setPreDespacho(null);
      refresh();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al despachar', 'error');
    } finally {
      setDespachando(null);
    }
  };

  return (
    <div className="despacho-view animate-up">
      <div className="card table-container">
        <table className="custom-table">
          <thead><tr><th>ID</th><th>Empleado</th><th>Gerencia</th><th>Estado</th><th className="t-right">Acción</th></tr></thead>
          <tbody>
            {pendientes.map((r,idx) => (
              <tr key={idx}>
                <td className="code-cell">#{r.IdSolicitud}</td>
                <td><strong>{r.EmpleadoNombre || r.EmpleadoCarnet}</strong></td>
                <td>{r.Gerencia || '-'}</td>
                <td><span className={`badge badge-${r.Estado?.toLowerCase()}`}>{r.Estado}</span></td>
                <td className="t-right">
                  <button className="btn btn-primary" onClick={() => abrirPreDespacho(r.IdSolicitud)} disabled={loading}>
                    <Package size={16}/> Despachar
                  </button>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}>No hay solicitudes pendientes de despacho.</td></tr>}
          </tbody>
        </table>
      </div>

      {preDespacho && (
        <div className="card" style={{marginTop:'24px'}}>
          <div className="card-h">
            <h3>Pre-despacho #{preDespacho.idSolicitud}</h3>
            <button className="btn btn-outline" onClick={() => setPreDespacho(null)}>Cerrar</button>
          </div>
          <div style={{padding:'20px'}}>
            <table className="custom-table">
              <thead><tr><th>Artículo</th><th>Aprobado</th><th>Entregado</th><th>Pendiente</th><th>Stock</th><th>A Despachar</th><th>Lotes</th></tr></thead>
              <tbody>
                {preDespacho.lineas.map((l, idx) => (
                  <tr key={idx}>
                    <td><strong>{l.Nombre}</strong><br/><small>{l.Talla}/{l.Sexo}</small></td>
                    <td>{l.CantidadAprobada}</td>
                    <td>{l.CantidadEntregada}</td>
                    <td><strong style={{color: l.Pendiente > 0 ? '#d97706' : '#16a34a'}}>{l.Pendiente}</strong></td>
                    <td><strong style={{color: l.StockVar >= l.Pendiente ? '#16a34a' : '#dc2626'}}>{l.StockVar}</strong></td>
                    <td>
                      <input type="number" min="0" max={Math.min(l.Pendiente, l.StockVar)}
                        defaultValue={l.Pendiente}
                        style={{width:'70px', padding:'6px', borderRadius:'6px', border:'1px solid #cbd5e1', textAlign:'center'}}
                        onChange={e => {
                          const next = [...preDespacho.lineas];
                          next[idx].cantidadDespachar = parseInt(e.target.value) || 0;
                          setPreDespacho({ ...preDespacho, lineas: next });
                        }}
                      />
                    </td>
                    <td>
                      {l.lotesDisponibles?.length > 0 ? (
                        <small>{l.lotesDisponibles.map(lt => `${lt.LoteCodigo} (${lt.StockActual})`).join(', ')}</small>
                      ) : <small>Sin lotes</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-actions" style={{marginTop:'16px'}}>
              <button className="btn btn-primary" onClick={confirmarDespacho} disabled={despachando === preDespacho.idSolicitud}>
                {despachando === preDespacho.idSolicitud ? 'Despachando...' : 'Confirmar Despacho'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodegaTab;
