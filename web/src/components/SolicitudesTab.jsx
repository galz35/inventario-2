import React from 'react';
import { ChevronRight } from 'lucide-react';

const SolicitudesTab = ({ requests, onOpenDetalle }) => (
  <div className="solicitudes-view animate-up">
    <div className="card table-container">
      <table className="custom-table">
        <thead><tr><th>ID</th><th>Empleado</th><th>Motivo</th><th>Fecha</th><th>Estado</th><th className="t-right">Acción</th></tr></thead>
        <tbody>
          {requests.map((r,idx)=>(
            <tr key={idx}>
              <td className="code-cell">#{r.IdSolicitud}</td>
              <td><strong>{r.EmpleadoNombre || r.EmpleadoCarnet}</strong></td>
              <td>{r.MotivoUsuario || r.Motivo || '-'}</td>
              <td>{new Date(r.FechaCreacion || r.FechaSolicitud).toLocaleDateString()}</td>
              <td><span className={`badge badge-${r.Estado?.toLowerCase()}`}>{r.Estado}</span></td>
              <td className="t-right"><button className="btn btn-outline btn-icon" onClick={() => onOpenDetalle(r.IdSolicitud)}><ChevronRight size={16}/></button></td>
            </tr>
          ))}
          {requests.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'40px'}}>No hay solicitudes.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
);

export default SolicitudesTab;
