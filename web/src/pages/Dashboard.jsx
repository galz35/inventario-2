import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Boxes, FileText, CheckCircle2, Truck, History,
  Menu, X, Bell, LogOut, Plus, Search, ChevronRight, AlertTriangle,
  Clock, ArrowUpRight, Package, Eye, Check, Ban, Trash2, Send, Shield
} from 'lucide-react';
import api from '../api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import MonitorTab from '../components/MonitorTab';
import InventarioTab from '../components/InventarioTab';
import SolicitudesTab from '../components/SolicitudesTab';
import BodegaTab from '../components/BodegaTab';
import KardexTab from '../components/KardexTab';
import ScopeSelector from '../components/ScopeSelector';
import AdminTab from '../components/AdminTab';

const MotionDiv = motion.div;

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [selectedAlm, setSelectedAlm] = useState(null);
  const [scope, setScope] = useState('PROPIAS');

  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [kardexDesde, setKardexDesde] = useState('2024-01-01');
  const [kardexHasta, setKardexHasta] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({ pendientesAprobacion: 0, pendientesDespacho: 0, stockBajo: 0, movimientosHoy: 0 });

  const addToast = useToast();
  const [isCrearModal, setCrearModal] = useState(false);
  const [isDetalleModal, setDetalleModal] = useState(false);
  const [detalleReq, setDetalleReq] = useState(null);
  const [loadingCrear, setLoadingCrear] = useState(false);
  const [loadingAprobar, setLoadingAprobar] = useState(false);
  const [loadingRechazar, setLoadingRechazar] = useState(false);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [isRechazarModal, setRechazarModal] = useState(false);
  const [rechazarId, setRechazarId] = useState(null);

  const [form, setForm] = useState({ motivo: '', detalles: [] });
  const [articulosBase, setArticulosBase] = useState([]);

  const fetchInit = useCallback(async () => {
    try {
      const resA = await api.get(`/almacenes?pais=${user.pais}`);
      setAlmacenes(resA.data.data);
      if (resA.data.data.length > 0) setSelectedAlm(resA.data.data[0].IdAlmacen);
      const resB = await api.get('/articulos');
      setArticulosBase(resB.data.data);
    } catch (e) { console.error(e); }
  }, [user.pais]);

  const refresh = useCallback(async () => {
    try {
      const params = scope === 'PROPIAS' ? `?pais=${user.pais}&carnet=${user.carnet}` : `?pais=${user.pais}`;
      if (activeTab === 'dashboard' || activeTab === 'inventory') {
        const [rI, rS] = await Promise.all([
          api.get(`/inventario?idAlmacen=${selectedAlm}`),
          api.get(`/solicitudes/stats?idAlmacen=${selectedAlm}`)
        ]);
        setInventory(rI.data.data);
        setStats(rS.data.data);
      }
      if (activeTab === 'solicitudes') {
        const rR = await api.get(`/solicitudes${params}`);
        setRequests(rR.data.data);
      }
      if (activeTab === 'kardex') {
        const rK = await api.get(`/kardex?idAlmacen=${selectedAlm}&desde=${kardexDesde}&hasta=${kardexHasta}`);
        setKardex(rK.data.data);
      }
    } catch (e) { console.error(e); }
  }, [activeTab, selectedAlm, user.pais, user.carnet, kardexDesde, kardexHasta, scope]);

  useEffect(() => { fetchInit(); }, [fetchInit]);
  useEffect(() => { if (selectedAlm) refresh(); }, [selectedAlm, activeTab, refresh]);

  const submitSolicitud = async () => {
    if (!form.motivo || form.motivo.trim().length === 0) {
      addToast('Ingrese un motivo para la solicitud', 'error'); return;
    }
    if (form.detalles.length === 0) {
      addToast('Agregue al menos un artículo', 'error'); return;
    }
    setLoadingCrear(true);
    try {
      await api.post('/solicitudes', {
        empleadoCarnet: user.carnet,
        motivo: form.motivo,
        detalles: form.detalles
      });
      setCrearModal(false);
      setForm({ motivo: '', detalles: [] });
      addToast('Solicitud creada con éxito', 'success');
      refresh();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al crear solicitud', 'error');
    } finally {
      setLoadingCrear(false);
    }
  };

  const addArticulo = () => {
    setForm({ ...form, detalles: [...form.detalles, { idArticulo: '', talla: '', sexo: '', cantidad: 1 }] });
  };

  const openDetalle = async (reqId) => {
    try {
      const res = await api.get(`/solicitudes/${reqId}/detalle?idAlmacen=${selectedAlm}`);
      setDetalleReq({ id: reqId, lineas: res.data.data });
      setDetalleModal(true);
    } catch (e) { console.error(e); }
  };

  const aprobarSolicitud = async (id) => {
    setLoadingAprobar(true);
    try {
      await api.post(`/solicitudes/${id}/aprobar`, {});
      setDetalleModal(false);
      addToast('Solicitud aprobada con éxito', 'success');
      refresh();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al aprobar', 'error');
    } finally {
      setLoadingAprobar(false);
    }
  };

  const confirmarRechazo = async () => {
    if (!rechazarMotivo || rechazarMotivo.trim().length === 0) {
      addToast('Ingrese un motivo de rechazo', 'error'); return;
    }
    setLoadingRechazar(true);
    try {
      await api.post(`/solicitudes/${rechazarId}/rechazar`, { motivo: rechazarMotivo });
      setDetalleModal(false);
      setRechazarModal(false);
      setRechazarMotivo('');
      setRechazarId(null);
      addToast('Solicitud rechazada', 'success');
      refresh();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error al rechazar', 'error');
    } finally {
      setLoadingRechazar(false);
    }
  };

  const rechazarSolicitud = (id) => {
    setRechazarId(id);
    setRechazarMotivo('');
    setRechazarModal(true);
  };

  const exportarExcel = async () => {
    const { default: XLSX } = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(inventory.map(i => ({
      Codigo: i.Codigo, Articulo: i.Nombre, Talla: i.Talla, Sexo: i.Sexo,
      StockActual: i.StockActual, StockMinimo: i.StockMinimo,
      Estado: i.StockActual <= i.StockMinimo ? 'Bajo' : 'Normal'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Inventario_Export.xlsx");
  };

  const roles = user?.roles || [];
  const esBodega = roles.includes('BODEGA') || roles.includes('ADMIN');
  const esRRHH = roles.includes('RRHH_APRUEBA') || roles.includes('ADMIN');
  const esAdmin = roles.includes('ADMIN');

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Central', icon: LayoutDashboard },
    { id: 'inventory', label: 'Gestión de Stock', icon: Boxes },
    { id: 'solicitudes', label: 'Solicitudes', icon: FileText },
    ...(esBodega ? [{ id: 'despacho', label: 'Despacho', icon: Truck }] : []),
    { id: 'kardex', label: 'Historial / Auditoría', icon: History },
    ...(esAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-top">
          <div className="brand">
            <div className="logo-icon"><Boxes size={24} color="#fff"/></div>
            <span>INVENTARIO <small>v2.0</small></span>
          </div>
          <nav className="nav-menu">
            {menuItems.map(m => (
              <button key={m.id} className={`nav-link ${activeTab === m.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(m.id); setMenuOpen(false); }}>
                <m.icon size={20} />
                <span>{m.label}</span>
                {activeTab === m.id && <MotionDiv layoutId="activeNav" className="active-blob" />}
              </button>
            ))}
          </nav>
        </div>
        <div className="side-bottom">
          <div className="user-pill">
            <div className="u-avatar">{user.nombre?.split(' ').map(n=>n[0]).join('') || user.carnet?.substring(0,2)}</div>
            <div className="u-meta">
              <strong>{user.nombre?.split(' ')[0] || 'Usuario'}</strong>
              <small>{user.carnet}</small>
            </div>
            <button className="btn-logout" onClick={onLogout} title="Cerrar Sesión"><LogOut size={16}/></button>
          </div>
        </div>
      </aside>

      {isMenuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main">
        <header className="top-bar">
          <div className="bar-left">
            <button className="menu-btn" onClick={() => setMenuOpen(true)}><Menu size={24}/></button>
            <div className="page-info">
              <h1>{menuItems.find(i=>i.id===activeTab)?.label}</h1>
              <p>Claro {user?.pais === 'NI' ? 'Nicaragua' : user?.pais} · Dirección de RRHH</p>
            </div>
          </div>
          <div className="bar-right">
            <ScopeSelector value={scope} onChange={setScope} user={user} />
            <div className="alm-selector card">
              <Package size={16} color="#DA291C"/>
              <select value={selectedAlm} onChange={e=>setSelectedAlm(parseInt(e.target.value))}>
                {almacenes.map(a=><option key={a.IdAlmacen} value={a.IdAlmacen}>{a.Nombre}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={()=>setCrearModal(true)}>
              <Plus size={18}/> <span>Nueva Solicitud</span>
            </button>
          </div>
        </header>

        <section className="scroll-content">
          <div className="view-wrapper">
            {activeTab === 'dashboard' && <MonitorTab stats={stats} inventory={inventory} />}
            {activeTab === 'inventory' && <InventarioTab inventory={inventory} selectedAlm={selectedAlm} exportarExcel={exportarExcel} />}
            {activeTab === 'solicitudes' && <SolicitudesTab requests={requests} onOpenDetalle={openDetalle} />}
            {activeTab === 'kardex' && (
              <KardexTab kardex={kardex} kardexDesde={kardexDesde} kardexHasta={kardexHasta}
                onChangeDesde={setKardexDesde} onChangeHasta={setKardexHasta} onRefresh={refresh} />
            )}
            {activeTab === 'despacho' && esBodega && (
              <BodegaTab selectedAlm={selectedAlm} user={user} addToast={addToast} />
            )}
            {activeTab === 'admin' && esAdmin && <AdminTab user={user} />}
          </div>
        </section>
      </main>

      <Modal isOpen={isCrearModal} onClose={()=>setCrearModal(false)} title="Nueva Solicitud Administrativa">
        <div className="modal-form">
          <div className="input-group">
            <label>Descripción General del Pedido</label>
            <input placeholder="Ej: Dotación Operativa I Semestre 2024" value={form.motivo} onChange={e=>setForm({...form, motivo: e.target.value})}/>
          </div>
          <div className="detalles-section">
            <div className="section-h">
              <span>Listado de Artículos</span>
              <button className="btn-add-text" onClick={addArticulo}>+ Añadir Línea</button>
            </div>
            <div className="items-list">
              {form.detalles.length === 0 && <div className="empty-items">No has añadido artículos aún.</div>}
              {form.detalles.map((d,idx)=>(
                <div key={idx} className="item-row card">
                  <select value={d.idArticulo} onChange={e=>{
                    const next = [...form.detalles];
                    next[idx].idArticulo = e.target.value;
                    setForm({...form, detalles: next});
                  }}>
                    <option value="">Seleccione un artículo...</option>
                    {articulosBase.map(a=><option key={a.IdArticulo} value={a.IdArticulo}>{a.Nombre}</option>)}
                  </select>
                  <div className="qty-box">
                    <input type="number" min="1" value={d.cantidad} onChange={e=>{
                      const next = [...form.detalles];
                      next[idx].cantidad = e.target.value;
                      setForm({...form, detalles: next});
                    }}/>
                  </div>
                  <button className="del-btn" onClick={()=>setForm({...form, detalles: form.detalles.filter((_,i)=>i!==idx)})}><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={()=>setCrearModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={submitSolicitud} disabled={loadingCrear}>
              <Send size={16}/> {loadingCrear ? 'Enviando...' : 'Enviar Pedido'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetalleModal} onClose={()=>setDetalleModal(false)} title={'Detalle de Solicitud #' + detalleReq?.id}>
        <div className="modal-form">
          <table className="custom-table">
            <thead><tr><th>Artículo</th><th>Talla / Sexo</th><th>Solicitado</th><th>Aprobado</th><th>Pendiente</th><th>Disponible</th></tr></thead>
            <tbody>
              {detalleReq?.lineas.map((l,idx) => (
                <tr key={idx}>
                  <td><strong>{l.Nombre}</strong></td>
                  <td>{l.Talla} / {l.Sexo}</td>
                  <td>{l.CantidadSolicitada}</td>
                  <td>{l.CantidadAprobada}</td>
                  <td><strong style={{color: l.Pendiente > 0 ? '#d97706' : '#16a34a'}}>{l.Pendiente}</strong></td>
                  <td><strong style={{color: l.StockVar >= l.Pendiente ? '#16a34a' : '#dc2626'}}>{l.StockVar || 0}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-outline" onClick={()=>setDetalleModal(false)}>Cerrar</button>
            {esRRHH && (
              <>
                <button className="btn btn-outline" style={{borderColor: '#dc2626', color: '#dc2626'}}
                  onClick={() => rechazarSolicitud(detalleReq?.id)} disabled={loadingRechazar}>
                  <Ban size={16}/> Rechazar
                </button>
                <button className="btn btn-primary" style={{background: '#16a34a'}}
                  onClick={() => aprobarSolicitud(detalleReq?.id)} disabled={loadingAprobar}>
                  <Check size={16}/> {loadingAprobar ? 'Aprobando...' : 'Aprobar'}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRechazarModal} onClose={() => { setRechazarModal(false); setRechazarMotivo(''); }} title="Rechazar Solicitud">
        <div className="modal-form">
          <div className="input-group">
            <label>Motivo de Rechazo</label>
            <textarea placeholder="Describa la razón del rechazo..." value={rechazarMotivo}
              onChange={e => setRechazarMotivo(e.target.value)} rows={4}
              style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', fontSize:'14px', outline:'none', resize:'vertical', fontFamily:'inherit' }}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setRechazarModal(false); setRechazarMotivo(''); }}>Cancelar</button>
            <button className="btn btn-primary" style={{background:'#dc2626'}} onClick={confirmarRechazo} disabled={loadingRechazar}>
              {loadingRechazar ? 'Rechazando...' : 'Confirmar Rechazo'}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .layout { display: flex; height: 100vh; overflow: hidden; background: var(--bg-page); }
        .sidebar { width: 280px; height: 100%; background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: var(--transition); z-index: 1000; }
        .side-top { flex: 1; padding: 32px 16px; display: flex; flex-direction: column; gap: 40px; }
        .brand { display: flex; align-items: center; gap: 12px; padding: 0 8px; }
        .logo-icon { width: 40px; height: 40px; background: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(218, 41, 28, 0.3); }
        .brand span { font-family: var(--font-display); font-weight: 800; font-size: 18px; letter-spacing: -0.5px; }
        .brand small { font-size: 10px; opacity: 0.5; margin-left: 4px; }
        .nav-menu { display: flex; flex-direction: column; gap: 4px; }
        .nav-link { position: relative; display: flex; align-items: center; gap: 14px; padding: 12px 16px; border: none; background: transparent; color: var(--text-secondary); font-weight: 600; cursor: pointer; border-radius: 12px; transition: var(--transition); text-align: left; font-size: 14px; }
        .nav-link:hover { background: #f8fafc; color: var(--text-main); }
        .nav-link.active { color: var(--primary); }
        .active-blob { position: absolute; left: 0; right: 0; top: 0; bottom: 0; background: var(--primary-soft); border-radius: 12px; z-index: -1; }
        .side-bottom { padding: 24px 16px; border-top: 1px solid var(--border); }
        .user-pill { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px; border-radius: 16px; }
        .u-avatar { width: 36px; height: 36px; background: #e2e8f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
        .u-meta { flex: 1; }
        .u-meta strong { display: block; font-size: 13px; line-height: 1.2; }
        .u-meta small { font-size: 11px; color: var(--text-muted); }
        .btn-logout { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; transition: 0.2s; }
        .btn-logout:hover { color: var(--error); }
        .main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .top-bar { height: 80px; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); z-index: 500; }
        .bar-left { display: flex; align-items: center; gap: 20px; }
        .menu-btn { display: none; background: none; border: none; color: var(--text-main); cursor: pointer; }
        .page-info h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .page-info p { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        .bar-right { display: flex; align-items: center; gap: 16px; }
        .alm-selector { padding: 8px 16px; display: flex; align-items: center; gap: 10px; border-radius: 12px; }
        .alm-selector select { border: none; background: transparent; font-weight: 700; font-size: 13px; outline: none; }
        .scroll-content { flex: 1; overflow-y: auto; padding: 40px; }
        .view-wrapper { max-width: 1200px; margin: 0 auto; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
        .stat-card { padding: 24px; display: flex; align-items: center; gap: 20px; }
        .s-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .s-val h3 { font-size: 28px; line-height: 1; margin-bottom: 4px; }
        .s-val p { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.5px; }
        .card-h { padding: 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .card-h h3 { font-size: 16px; font-weight: 800; }
        .table-responsive { width: 100%; border-radius: 0 0 16px 16px; overflow: hidden; }
        .custom-table { width: 100%; border-collapse: collapse; }
        .custom-table th { background: #f8fafc; text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .custom-table td { padding: 16px 20px; border-bottom: 1px solid var(--border); font-size: 14px; }
        .custom-table tr:last-child td { border-bottom: none; }
        .code-cell { font-family: 'Space Grotesk', monospace; font-weight: 700; color: var(--primary); font-size: 12px; }
        .name-cell strong { display: block; color: var(--text-main); }
        .name-cell span { font-size: 11px; color: var(--text-muted); font-weight: 500; }
        .pill { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--text-secondary); }
        .stock-cell { font-weight: 800; font-size: 16px; }
        .status-dot { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
        .status-dot::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.success::before { background: var(--success); box-shadow: 0 0 8px var(--success); }
        .status-dot.error::before { background: var(--error); box-shadow: 0 0 8px var(--error); }
        .level-bar { height: 6px; border-radius: 3px; background: #e2e8f0; position: relative; }
        .level-bar::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 60%; border-radius: 3px; }
        .level-bar.ok::after { background: var(--success); }
        .level-bar.low::after { background: var(--error); }
        .type-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .type-tag.entrada { background: #DCFCE7; color: #166534; }
        .type-tag.salida { background: #FEE2E2; color: #991B1B; }
        .filters-bar { display: flex; justify-content: space-between; align-items: center; padding: 20px; margin-bottom: 24px; }
        .search-box { display: flex; align-items: center; gap: 12px; flex: 1; max-width: 400px; }
        .search-box input { border: none; background: transparent; font-size: 14px; width: 100%; outline: none; }
        .two-cols { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        .info-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .info-item { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 500; }
        .info-dot { width: 8px; height: 8px; border-radius: 50%; }
        .info-dot.green { background: var(--success); }
        .info-dot.amber { background: var(--warning); }
        .modal-form { display: flex; flex-direction: column; gap: 24px; }
        .input-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; }
        .input-group input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); font-size: 14px; outline: none; transition: 0.2s; }
        .input-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft); }
        .detalles-section { display: flex; flex-direction: column; gap: 12px; }
        .section-h { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 700; }
        .btn-add-text { background: none; border: none; color: var(--primary); font-weight: 700; font-size: 12px; cursor: pointer; }
        .items-list { display: flex; flex-direction: column; gap: 10px; }
        .item-row { padding: 12px; display: flex; gap: 12px; align-items: center; }
        .item-row select { flex: 1; border: none; background: transparent; font-size: 13px; font-weight: 600; outline: none; }
        .qty-box { width: 80px; }
        .qty-box input { width: 100%; text-align: center; border: none; background: #f8fafc; padding: 6px; border-radius: 6px; font-weight: 700; }
        .del-btn { color: var(--text-muted); background: none; border: none; cursor: pointer; }
        .del-btn:hover { color: var(--error); }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-pendiente { background: #FEF3C7; color: #92400E; }
        .badge-aprobada { background: #DCFCE7; color: #166534; }
        .badge-parcial { background: #FEF3C7; color: #92400E; }
        .badge-atendida { background: #DBEAFE; color: #1E40AF; }
        .badge-rechazada { background: #FEE2E2; color: #991B1B; }
        .t-right { text-align: right; }
        .btn-icon { padding: 8px; }
        .empty-items { text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px; }
        @media (max-width: 1024px) {
          .sidebar { position: fixed; transform: translateX(-100%); width: 260px; }
          .sidebar.open { transform: translateX(0); }
          .menu-btn { display: block; }
          .top-bar { padding: 0 20px; }
          .scroll-content { padding: 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .two-cols { grid-template-columns: 1fr; }
          .bar-right .alm-selector { display: none; }
        }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 900; backdrop-filter: blur(4px); }
      `}</style>
    </div>
  );
};

export default Dashboard;
