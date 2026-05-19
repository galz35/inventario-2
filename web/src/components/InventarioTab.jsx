import React, { useState } from 'react';
import { Search, FileText, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../api';
import Modal from './Modal';
import { useToast } from './Toast';

const InventarioTab = ({ inventory, selectedAlm, exportarExcel }) => {
  const [filter, setFilter] = useState('');
  const [isEntradaModal, setEntradaModal] = useState(false);
  const [isMermaModal, setMermaModal] = useState(false);
  const [formMov, setFormMov] = useState({ idArticulo: '', talla: 'UNI', sexo: 'N', cantidad: 1, comentario: '', lote: '', vence: '' });
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  const submitMovimiento = async (tipo) => {
    if (!formMov.idArticulo) { addToast('Seleccione un artículo', 'error'); return; }
    if (!formMov.cantidad || formMov.cantidad < 1) { addToast('Cantidad debe ser > 0', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/inventario/movimiento', {
        idAlmacen: selectedAlm, tipo, idArticulo: parseInt(formMov.idArticulo),
        talla: formMov.talla, sexo: formMov.sexo, cantidad: formMov.cantidad,
        comentario: formMov.comentario, lote: formMov.lote || null, fechaVencimiento: formMov.vence || null,
      });
      addToast(`${tipo === 'ENTRADA' ? 'Entrada' : 'Merma'} registrada con éxito`, 'success');
      setEntradaModal(false); setMermaModal(false);
      setFormMov({ idArticulo: '', talla: 'UNI', sexo: 'N', cantidad: 1, comentario: '', lote: '', vence: '' });
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al registrar movimiento', 'error');
    } finally { setLoading(false); }
  };

  const articulosUnicos = [...new Map((inventory || []).map(i => [i.IdArticulo, i])).values()];

  return (
    <div className="inventory-view animate-up">
      <div className="filters-bar card">
        <div className="search-box">
          <Search size={18} color="#94A3B8"/>
          <input placeholder="Buscar por código o nombre..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        </div>
        <div className="filter-actions" style={{display:'flex', gap:'8px'}}>
          <button className="btn btn-outline" onClick={() => setEntradaModal(true)} style={{color:'#166534'}}><ArrowUpRight size={16}/> Entrada</button>
          <button className="btn btn-outline" onClick={() => setMermaModal(true)} style={{color:'#991B1B'}}><ArrowDownRight size={16}/> Merma</button>
          <button className="btn btn-outline" onClick={exportarExcel}><FileText size={16}/> Exportar</button>
        </div>
      </div>

      <div className="card table-container">
        <table className="custom-table">
          <thead>
            <tr><th>Código</th><th>Artículo</th><th>Talla / Sexo</th><th>Stock Actual</th><th>Stock Mínimo</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {inventory.filter(i => i.Nombre?.toLowerCase().includes(filter.toLowerCase()) || i.Codigo?.toLowerCase().includes(filter.toLowerCase())).map((i,idx)=>(
              <tr key={idx}>
                <td className="code-cell">{i.Codigo}</td>
                <td><strong>{i.Nombre}</strong></td>
                <td><span className="pill">{i.Talla} · {i.Sexo}</span></td>
                <td className="stock-cell">{i.StockActual}</td>
                <td>{i.StockMinimo}</td>
                <td><span className={`status-dot ${i.StockActual <= i.StockMinimo ? 'error' : 'success'}`}>{i.StockActual <= i.StockMinimo ? 'Stock Bajo' : 'Normal'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isEntradaModal} onClose={() => setEntradaModal(false)} title="Registrar Entrada">
        <div className="modal-form">
          <div className="input-group">
            <label>Artículo</label>
            <select value={formMov.idArticulo} onChange={e => setFormMov({...formMov, idArticulo: e.target.value})}
              style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'14px'}}>
              <option value="">Seleccionar...</option>
              {articulosUnicos.map(a => <option key={a.IdArticulo} value={a.IdArticulo}>{a.Codigo} - {a.Nombre}</option>)}
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
            <div className="input-group"><label>Talla</label><input value={formMov.talla} onChange={e => setFormMov({...formMov, talla: e.target.value})}/></div>
            <div className="input-group"><label>Sexo</label><input value={formMov.sexo} onChange={e => setFormMov({...formMov, sexo: e.target.value})}/></div>
            <div className="input-group"><label>Cantidad</label><input type="number" min="1" value={formMov.cantidad} onChange={e => setFormMov({...formMov, cantidad: parseInt(e.target.value) || 0})}/></div>
          </div>
          <div className="input-group"><label>Comentario</label><input value={formMov.comentario} onChange={e => setFormMov({...formMov, comentario: e.target.value})} placeholder="Ej: Recepción proveedor"/></div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setEntradaModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => submitMovimiento('ENTRADA')} disabled={loading}>{loading ? 'Registrando...' : 'Registrar Entrada'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isMermaModal} onClose={() => setMermaModal(false)} title="Registrar Merma">
        <div className="modal-form">
          <div className="input-group">
            <label>Artículo</label>
            <select value={formMov.idArticulo} onChange={e => setFormMov({...formMov, idArticulo: e.target.value})}
              style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'14px'}}>
              <option value="">Seleccionar...</option>
              {articulosUnicos.map(a => <option key={a.IdArticulo} value={a.IdArticulo}>{a.Codigo} - {a.Nombre}</option>)}
            </select>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
            <div className="input-group"><label>Talla</label><input value={formMov.talla} onChange={e => setFormMov({...formMov, talla: e.target.value})}/></div>
            <div className="input-group"><label>Sexo</label><input value={formMov.sexo} onChange={e => setFormMov({...formMov, sexo: e.target.value})}/></div>
            <div className="input-group"><label>Cantidad</label><input type="number" min="1" value={formMov.cantidad} onChange={e => setFormMov({...formMov, cantidad: parseInt(e.target.value) || 0})}/></div>
          </div>
          <div className="input-group"><label>Comentario</label><input value={formMov.comentario} onChange={e => setFormMov({...formMov, comentario: e.target.value})} placeholder="Ej: Rotura / Vencido"/></div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setMermaModal(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{background:'#dc2626'}} onClick={() => submitMovimiento('MERMA')} disabled={loading}>{loading ? 'Registrando...' : 'Registrar Merma'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventarioTab;
