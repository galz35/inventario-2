import React, { useState, useEffect } from 'react';
import { Shield, Plus, Search, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from './Modal';
import { useToast } from './Toast';

const TABS = ['Roles', 'Almacenes', 'Artículos', 'Auditoría'];

const AdminTab = ({ user }) => {
  const [activeTab, setActiveTab] = useState('Roles');
  const [roles, setRoles] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(false);
  const addToast = useToast();

  const [showAsignarRol, setShowAsignarRol] = useState(false);
  const [showCrearAlmacen, setShowCrearAlmacen] = useState(false);
  const [showCrearArticulo, setShowCrearArticulo] = useState(false);
  const [formRol, setFormRol] = useState({ carnet: '', rol: 'BODEGA', activo: true });
  const [formAlmacen, setFormAlmacen] = useState({ codigo: '', nombre: '', pais: user.pais });
  const [formArticulo, setFormArticulo] = useState({ codigo: '', nombre: '', tipo: 'EPP', unidad: 'UN' });
  const [auditModulo, setAuditModulo] = useState('');

  const loadRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data.data);
    } catch (e) { console.error(e); }
  };

  const loadAlmacenes = async () => {
    try {
      const res = await api.get(`/almacenes?pais=${user.pais}`);
      setAlmacenes(res.data.data);
    } catch (e) { console.error(e); }
  };

  const loadArticulos = async () => {
    try {
      const res = await api.get('/articulos');
      setArticulos(res.data.data);
    } catch (e) { console.error(e); }
  };

  const loadAudit = async (modulo) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modulo) params.set('modulo', modulo);
      const res = await api.get(`/admin/audit?${params.toString()}`);
      setAudit(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'Roles') loadRoles();
    if (activeTab === 'Almacenes') loadAlmacenes();
    if (activeTab === 'Artículos') loadArticulos();
    if (activeTab === 'Auditoría') loadAudit(auditModulo);
  }, [activeTab]);

  const asignarRol = async () => {
    if (!formRol.carnet) { addToast('Carnet requerido', 'error'); return; }
    try {
      await api.post('/admin/roles', formRol);
      addToast('Rol asignado', 'success');
      setShowAsignarRol(false);
      setFormRol({ carnet: '', rol: 'BODEGA', activo: true });
      loadRoles();
    } catch (e) { addToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const crearAlmacen = async () => {
    if (!formAlmacen.codigo || !formAlmacen.nombre) { addToast('Código y nombre requeridos', 'error'); return; }
    try {
      await api.post('/admin/almacenes', formAlmacen);
      addToast('Almacén creado', 'success');
      setShowCrearAlmacen(false);
      setFormAlmacen({ codigo: '', nombre: '', pais: user.pais });
      loadAlmacenes();
    } catch (e) { addToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const crearArticulo = async () => {
    if (!formArticulo.codigo || !formArticulo.nombre) { addToast('Código y nombre requeridos', 'error'); return; }
    try {
      await api.post('/admin/articulos', formArticulo);
      addToast('Artículo creado', 'success');
      setShowCrearArticulo(false);
      setFormArticulo({ codigo: '', nombre: '', tipo: 'EPP', unidad: 'UN' });
      loadArticulos();
    } catch (e) { addToast(e.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <div className="admin-view animate-up">
      <div className="admin-tabs" style={{display:'flex', gap:'8px', marginBottom:'24px'}}>
        {TABS.map(t => (
          <button key={t} className={`btn ${activeTab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Roles' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3>Roles del Sistema</h3>
            <button className="btn btn-primary" onClick={() => setShowAsignarRol(true)}><Plus size={16}/> Asignar Rol</button>
          </div>
          <div className="card table-container">
            <table className="custom-table">
              <thead><tr><th>Carnet</th><th>Nombre</th><th>Rol</th><th>Activo</th></tr></thead>
              <tbody>
                {roles.map((r,i) => (
                  <tr key={i}>
                    <td className="code-cell">{r.Carnet}</td>
                    <td>{r.nombre_completo || '-'}</td>
                    <td><span className="badge badge-aprobada">{r.Rol}</span></td>
                    <td>{r.Activo ? '✅' : '❌'}</td>
                  </tr>
                ))}
                {roles.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}>Sin roles registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Almacenes' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3>Almacenes</h3>
            <button className="btn btn-primary" onClick={() => setShowCrearAlmacen(true)}><Plus size={16}/> Nuevo Almacén</button>
          </div>
          <div className="card table-container">
            <table className="custom-table">
              <thead><tr><th>Código</th><th>Nombre</th><th>País</th></tr></thead>
              <tbody>
                {almacenes.map((a,i) => (
                  <tr key={i}>
                    <td className="code-cell">{a.Codigo}</td>
                    <td>{a.Nombre}</td>
                    <td>{a.Pais}</td>
                  </tr>
                ))}
                {almacenes.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'40px'}}>Sin almacenes.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Artículos' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3>Artículos</h3>
            <button className="btn btn-primary" onClick={() => setShowCrearArticulo(true)}><Plus size={16}/> Nuevo Artículo</button>
          </div>
          <div className="card table-container">
            <table className="custom-table">
              <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Unidad</th></tr></thead>
              <tbody>
                {articulos.map((a,i) => (
                  <tr key={i}>
                    <td className="code-cell">{a.Codigo}</td>
                    <td>{a.Nombre}</td>
                    <td><span className="badge badge-pendiente">{a.Tipo}</span></td>
                    <td>{a.Unidad}</td>
                  </tr>
                ))}
                {articulos.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'40px'}}>Sin artículos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Auditoría' && (
        <div>
          <div style={{display:'flex', gap:'12px', marginBottom:'16px', alignItems:'center'}}>
            <h3>Registro de Auditoría</h3>
            <select value={auditModulo} onChange={e => { setAuditModulo(e.target.value); loadAudit(e.target.value); }}
              style={{padding:'8px', borderRadius:'8px', border:'1px solid #cbd5e1', marginLeft:'16px'}}>
              <option value="">Todos los módulos</option>
              <option value="AUTH">AUTH</option>
              <option value="SOLICITUDES">SOLICITUDES</option>
              <option value="BODEGA">BODEGA</option>
              <option value="INVENTARIO">INVENTARIO</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="card table-container">
            <table className="custom-table">
              <thead><tr><th>Fecha</th><th>Módulo</th><th>Acción</th><th>Actor</th><th>Entidad</th></tr></thead>
              <tbody>
                {audit.map((a,i) => (
                  <tr key={i}>
                    <td style={{fontSize:'12px'}}>{new Date(a.Fecha).toLocaleString()}</td>
                    <td><span className="badge badge-aprobada">{a.Modulo}</span></td>
                    <td>{a.Accion}</td>
                    <td className="code-cell">{a.CarnetActor || '-'}</td>
                    <td>{a.Entidad || '-'} {a.IdEntidad ? `#${a.IdEntidad}` : ''}</td>
                  </tr>
                ))}
                {audit.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}>{loading ? 'Cargando...' : 'Sin registros de auditoría.'}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showAsignarRol} onClose={() => setShowAsignarRol(false)} title="Asignar Rol">
        <div className="modal-form">
          <div className="input-group">
            <label>Carnet del empleado</label>
            <input value={formRol.carnet} onChange={e => setFormRol({...formRol, carnet: e.target.value})} placeholder="Ej: 500708"/>
          </div>
          <div className="input-group">
            <label>Rol</label>
            <select value={formRol.rol} onChange={e => setFormRol({...formRol, rol: e.target.value})}
              style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'14px'}}>
              <option value="BODEGA">BODEGA</option>
              <option value="RRHH_APRUEBA">RRHH_APRUEBA</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setShowAsignarRol(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={asignarRol}>Guardar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCrearAlmacen} onClose={() => setShowCrearAlmacen(false)} title="Nuevo Almacén">
        <div className="modal-form">
          <div className="input-group"><label>Código</label><input value={formAlmacen.codigo} onChange={e => setFormAlmacen({...formAlmacen, codigo: e.target.value})} placeholder="Ej: BOD-02"/></div>
          <div className="input-group"><label>Nombre</label><input value={formAlmacen.nombre} onChange={e => setFormAlmacen({...formAlmacen, nombre: e.target.value})} placeholder="Ej: Bodega Sur"/></div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setShowCrearAlmacen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearAlmacen}>Crear</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCrearArticulo} onClose={() => setShowCrearArticulo(false)} title="Nuevo Artículo">
        <div className="modal-form">
          <div className="input-group"><label>Código</label><input value={formArticulo.codigo} onChange={e => setFormArticulo({...formArticulo, codigo: e.target.value})} placeholder="Ej: ROP-001"/></div>
          <div className="input-group"><label>Nombre</label><input value={formArticulo.nombre} onChange={e => setFormArticulo({...formArticulo, nombre: e.target.value})} placeholder="Ej: Camisa M/C"/></div>
          <div className="input-group">
            <label>Tipo</label>
            <select value={formArticulo.tipo} onChange={e => setFormArticulo({...formArticulo, tipo: e.target.value})}
              style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'14px'}}>
              <option value="ROPA">ROPA</option>
              <option value="EPP">EPP</option>
              <option value="MEDICAMENTO">MEDICAMENTO</option>
              <option value="EVENTO">EVENTO</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setShowCrearArticulo(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearArticulo}>Crear</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTab;
