import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Boxes, 
  FileText, 
  CheckCircle2, 
  Truck, 
  History, 
  Menu, 
  X, 
  Bell, 
  LogOut, 
  Plus, 
  Search, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight,
  Package,
  Eye,
  Check,
  Ban,
  Trash2,
  Send
} from 'lucide-react';
import axios from 'axios';

// --- Global UI Components ---

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="modal-overlay">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="modal-content glass"
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="btn-icon"><X size={20}/></button>
          </div>
          <div className="modal-body">{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [selectedAlm, setSelectedAlm] = useState(null);
  
  // Data
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [stats, setStats] = useState({ pendientesAprobacion: 0, pendientesDespacho: 0, stockBajo: 0, movimientosHoy: 0 });

  // UI
  const [loading, setLoading] = useState(false);
  const [isCrearModal, setCrearModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [filter, setFilter] = useState('');
  
  // Form State para Nueva Solicitud
  const [form, setForm] = useState({ motivo: '', detalles: [] });
  const [articulosBase, setArticulosBase] = useState([]);

  useEffect(() => {
    fetchInit();
  }, []);

  useEffect(() => {
    if (selectedAlm) refresh();
  }, [selectedAlm, activeTab]);

  const fetchInit = async () => {
    try {
        const resA = await axios.get(`/api/v1/almacenes?pais=${user.pais}`);
        setAlmacenes(resA.data.data);
        if (resA.data.data.length > 0) setSelectedAlm(resA.data.data[0].IdAlmacen);
        const resB = await axios.get('/api/v1/articulos');
        setArticulosBase(resB.data.data);
    } catch (e) { console.error(e); }
  };

  const refresh = async () => {
    setLoading(true);
    try {
        if (activeTab === 'dashboard' || activeTab === 'inventory') {
          const [rI, rS] = await Promise.all([
            axios.get(`/api/v1/inventario?idAlmacen=${selectedAlm}`),
            axios.get(`/api/v1/solicitudes/stats?idAlmacen=${selectedAlm}`)
          ]);
          setInventory(rI.data.data);
          setStats(rS.data.data);
        }
        if (activeTab === 'solicitudes') {
          const rR = await axios.get(`/api/v1/solicitudes?pais=${user.pais}`);
          setRequests(rR.data.data);
        }
        if (activeTab === 'kardex') {
          const rK = await axios.get(`/api/v1/kardex?idAlmacen=${selectedAlm}&desde=2024-01-01`);
          setKardex(rK.data.data);
        }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const submitSolicitud = async () => {
    if (!form.motivo || form.detalles.length === 0) return alert('Complete el formulario');
    await axios.post('/api/v1/solicitudes', {
      empleadoCarnet: user.carnet,
      motivo: form.motivo,
      detalles: form.detalles
    });
    setCrearModal(false);
    setForm({ motivo: '', detalles: [] });
    refresh();
  };

  const addArticulo = () => {
    setForm({ ...form, detalles: [...form.detalles, { idArticulo: '', talla: '', sexo: '', cantidad: 1 }] });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Central', icon: LayoutDashboard },
    { id: 'inventory', label: 'Gestión de Stock', icon: Boxes },
    { id: 'solicitudes', label: 'Solicitudes', icon: FileText },
    { id: 'kardex', label: 'Historial / Auditoría', icon: History },
  ];

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-top">
          <div className="brand">
            <div className="logo-icon"><Boxes size={24} color="#fff"/></div>
            <span>INVENTARIO <small>v2.0</small></span>
          </div>
          
          <nav className="nav-menu">
            {menuItems.map(m => (
              <button 
                key={m.id} 
                className={`nav-link ${activeTab === m.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(m.id); setMenuOpen(false); }}
              >
                <m.icon size={20} />
                <span>{m.label}</span>
                {activeTab === m.id && <motion.div layoutId="activeNav" className="active-blob" />}
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

      {/* OVERLAY FOR MOBILE */}
      {isMenuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="main">
        <header className="top-bar">
          <div className="bar-left">
            <button className="menu-btn" onClick={() => setMenuOpen(true)}><Menu size={24}/></button>
            <div className="page-info">
              <h1>{menuItems.find(i=>i.id===activeTab)?.label}</h1>
              <p>Claro Nicaragua · Dirección de RRHH</p>
            </div>
          </div>
          
          <div className="bar-right">
            <div className="alm-selector card">
              <Package size={16} color="#DA291C"/>
              <select value={selectedAlm} onChange={e=>setSelectedAlm(e.target.value)}>
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
            {activeTab === 'dashboard' && (
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
                        <button className="btn btn-outline btn-icon" onClick={refresh}><History size={16}/></button>
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
                         <div className="info-item">
                           <div className="info-dot green"/>
                           <span>Sincronizado con Portal Central</span>
                         </div>
                         <div className="info-item">
                           <div className="info-dot green"/>
                           <span>Seguridad JWT Activa</span>
                         </div>
                         <div className="info-item">
                           <div className="info-dot amber"/>
                           <span>Última auditoría: Hace 2 horas</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="inventory-view animate-up">
                <div className="filters-bar card">
                  <div className="search-box">
                    <Search size={18} color="#94A3B8"/>
                    <input placeholder="Buscar por código o nombre..." value={filter} onChange={e=>setFilter(e.target.value)}/>
                  </div>
                  <div className="filter-actions">
                     <button className="btn btn-outline"><FileText size={16}/> Exportar</button>
                  </div>
                </div>

                <div className="card table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descripción del Artículo</th>
                        <th>Talla / Sexo</th>
                        <th>Stock Actual</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.filter(i => i.Nombre.toLowerCase().includes(filter.toLowerCase()) || i.Codigo.toLowerCase().includes(filter.toLowerCase())).map((i,idx)=>(
                        <tr key={idx}>
                          <td className="code-cell">{i.Codigo}</td>
                          <td>
                            <div className="name-cell">
                              <strong>{i.Nombre}</strong>
                              <span>Uniformes de Campo</span>
                            </div>
                          </td>
                          <td><span className="pill">{i.Talla} · {i.Sexo}</span></td>
                          <td className="stock-cell">{i.StockActual}</td>
                          <td>
                            <span className={`status-dot ${i.StockActual <= i.StockMinimo ? 'error' : 'success'}`}>
                              {i.StockActual <= i.StockMinimo ? 'Stock Bajo' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'solicitudes' && (
              <div className="solicitudes-view animate-up">
                 <div className="card table-container">
                    <table className="custom-table">
                       <thead><tr><th>ID</th><th>Motivo</th><th>Fecha Solicitud</th><th>Estado</th><th className="t-right">Acción</th></tr></thead>
                       <tbody>
                          {requests.map((r,idx)=>(
                            <tr key={idx}>
                               <td className="code-cell">#{r.IdSolicitud}</td>
                               <td><strong>{r.Motivo}</strong></td>
                               <td>{new Date(r.FechaSolicitud).toLocaleDateString()}</td>
                               <td><span className={`badge badge-${r.Estado?.toLowerCase()}`}>{r.Estado}</span></td>
                               <td className="t-right"><button className="btn btn-outline btn-icon"><ChevronRight size={16}/></button></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {activeTab === 'kardex' && (
              <div className="kardex-view animate-up">
                 <div className="card table-container">
                    <table className="custom-table">
                       <thead><tr><th>Fecha / Hora</th><th>Tipo</th><th>Artículo</th><th>Cantidad</th><th>Usuario / Carnet</th></tr></thead>
                       <tbody>
                          {kardex.map((k,idx)=>(
                            <tr key={idx}>
                               <td>{new Date(k.Fecha).toLocaleString()}</td>
                               <td>
                                 <span className={`type-tag ${k.Tipo?.toLowerCase()}`}>
                                    {k.Tipo === 'Entrada' ? <ArrowUpRight size={12}/> : <Send size={12}/>}
                                    {k.Tipo}
                                 </span>
                               </td>
                               <td><strong>{k.ArticuloNombre}</strong></td>
                               <td className="code-cell">{k.Cantidad}</td>
                               <td><strong>{k.Usuario}</strong></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL NUEVA SOLICITUD */}
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
                        <button className="del-btn" onClick={()=>{
                           setForm({...form, detalles: form.detalles.filter((_,i)=>i!==idx)});
                        }}><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
             </div>

             <div className="form-actions">
                <button className="btn btn-outline" onClick={()=>setCrearModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={submitSolicitud}>
                   <Send size={16}/> Enviar Pedido
                </button>
             </div>
          </div>
      </Modal>

      <style jsx>{`
        .layout { display: flex; height: 100vh; overflow: hidden; background: var(--bg-page); }

        /* SIDEBAR */
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

        /* MAIN */
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

        /* KPI */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
        .stat-card { padding: 24px; display: flex; align-items: center; gap: 20px; }
        .s-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .s-val h3 { font-size: 28px; line-height: 1; margin-bottom: 4px; }
        .s-val p { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.5px; }

        /* TABLES */
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

        /* FORM */
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

        /* RESPONSIVE */
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
