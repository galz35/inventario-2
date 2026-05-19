import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { VisibilidadService } from '../empleados/visibilidad.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../common/email.service';

@Injectable()
@Dependencies(DatabaseService, VisibilidadService, AuditService, EmailService)
export class SolicitudesService {
  constructor(db, visibilidad, audit, email) {
    this.db = db;
    this.visibilidad = visibilidad;
    this.audit = audit;
    this.email = email;
  }

  async dashboardKPIs(idAlmacen) {
    const sql = this.db.getSql();
    const result = await this.db.query(`
      SELECT 
        (SELECT COUNT(*) FROM dbo.Solicitudes WHERE Estado = 'Pendiente') as pendientesAprobacion,
        (SELECT COUNT(*) FROM dbo.Solicitudes WHERE Estado IN ('Aprobada', 'Parcial')) as pendientesDespacho,
        (SELECT COUNT(*) FROM dbo.ArticulosStockVar WHERE IdAlmacen = @idAlmacen AND StockActual <= StockMinimo) as stockBajo,
        (SELECT COUNT(*) FROM dbo.MovimientosInventario WHERE IdAlmacen = @idAlmacen AND CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)) as movimientosHoy
    `, [{ name: 'idAlmacen', type: sql.Int, value: idAlmacen }]);
    return result.recordset[0];
  }

  async ultimosMovimientos(idAlmacen, limit = 10) {
    const sql = this.db.getSql();
    const result = await this.db.query(`
      SELECT TOP (@limit) m.*, a.Nombre as ArticuloNombre, a.Codigo as ArticuloCodigo
      FROM dbo.MovimientosInventario m
      JOIN dbo.Articulos a ON a.IdArticulo = m.IdArticulo
      WHERE m.IdAlmacen = @idAlmacen
      ORDER BY m.Fecha DESC
    `, [
      { name: 'idAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'limit', type: sql.Int, value: limit }
    ]);
    return result.recordset;
  }

  async listar(estado, desde, hasta, pais, usuario) {
    const sql = this.db.getSql();
    const roles = usuario?.roles || [];
    const carnet = usuario?.carnet;

    let carnetsCsv = null;

    if (roles.includes('ADMIN')) {
      // Admin ve todo
    } else if (roles.includes('BODEGA')) {
      // Bodega ve por pais (ya filtrado por @Pais)
    } else if (roles.includes('RRHH_APRUEBA')) {
      // RRHH ve por pais (ya filtrado por @Pais)
    } else if (carnet) {
      // Solicitante ve sus propias solicitudes
      carnetsCsv = carnet;
    }

    const result = await this.db.execute('dbo.Sol_Listar', [
      { name: 'Estado', type: sql.VarChar, value: estado || null },
      { name: 'Desde', type: sql.Date, value: desde || null },
      { name: 'Hasta', type: sql.Date, value: hasta || null },
      { name: 'Pais', type: sql.VarChar, value: pais || null },
      { name: 'CarnetsCsv', type: sql.VarChar, value: carnetsCsv },
    ]);
    return result.recordset;
  }

  async crear(empleadoCarnetBody, motivo, detalles, usuario, req = null) {
    const sql = this.db.getSql();
    const roles = usuario?.roles || [];
    const carnetSesion = usuario?.carnet;

    const puedeCrearParaOtro = roles.includes('ADMIN') || roles.includes('RRHH_APRUEBA');
    const empleadoCarnet = puedeCrearParaOtro && empleadoCarnetBody ? empleadoCarnetBody : carnetSesion;

    if (!empleadoCarnet) {
      throw new Error('No se puede determinar el carnet del solicitante');
    }

    const result = await this.db.execute('dbo.Sol_CrearSolicitud', [
      { name: 'EmpleadoCarnet', type: sql.VarChar, value: empleadoCarnet },
      { name: 'Motivo', type: sql.VarChar, value: motivo },
      { name: 'DetallesJson', type: sql.NVarChar, value: JSON.stringify(detalles) },
    ]);

    const idSolicitud = result.recordset[0]?.IdSolicitud;
    await this.audit.registrar('SOLICITUDES', 'CREAR', carnetSesion, empleadoCarnet, 'Solicitud', idSolicitud?.toString(), null, { motivo, detalles }, req);

    // Notificar al jefe por correo
    try {
      const empResult = await this.db.query(
        'SELECT e.nombre_completo, e.correo, e.correo_jefe1 FROM dbo.vw_EmpleadosActivos e WHERE e.carnet=@carnet',
        [{ name: 'carnet', type: sql.VarChar, value: empleadoCarnet }]
      );
      const emp = empResult.recordset[0];
      if (emp) {
        await this.email.notificarSolicitudCreada(idSolicitud, empleadoCarnet, emp.nombre_completo, emp.correo, emp.correo_jefe1, motivo);
      }
    } catch (e) {
      // Error de email no debe romper la solicitud
      console.error('Error sending email notification:', e.message);
    }

    return result.recordset[0];
  }

  async obtenerDetalle(idSolicitud, idAlmacen) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Sol_DetalleConStock', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
    ]);
    return result.recordset;
  }

  async aprobar(idSolicitud, carnetAprobador, usuario) {
    const sql = this.db.getSql();
    const roles = usuario?.roles || [];

    const puedeAdmin = roles.includes('ADMIN');
    const puedeRRHH = roles.includes('RRHH_APRUEBA');

    if (!puedeAdmin && !puedeRRHH) {
      const solResult = await this.db.query(
        'SELECT EmpleadoCarnet FROM dbo.Solicitudes WHERE IdSolicitud=@id',
        [{ name: 'id', type: sql.BigInt, value: idSolicitud }]
      );
      if (solResult.recordset.length === 0) {
        throw new Error('Solicitud no encontrada');
      }
      const empleadoCarnet = solResult.recordset[0].EmpleadoCarnet;
      const puedeVer = await this.visibilidad.puedeVer(carnetAprobador, empleadoCarnet);
      if (!puedeVer && carnetAprobador !== 'SYSTEM') {
        throw new Error('No tiene permisos para aprobar esta solicitud');
      }
    }

    await this.db.execute('dbo.Sol_Aprobar', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'CarnetAprobador', type: sql.VarChar, value: carnetAprobador },
    ]);

    await this.audit.registrar('SOLICITUDES', 'APROBAR', carnetAprobador, null, 'Solicitud', idSolicitud?.toString(), null, null);

    try {
      const empResult = await this.db.query(
        'SELECT e.nombre_completo, e.correo FROM dbo.vw_EmpleadosActivos e JOIN dbo.Solicitudes s ON s.EmpleadoCarnet=e.carnet WHERE s.IdSolicitud=@id',
        [{ name: 'id', type: sql.BigInt, value: idSolicitud }]
      );
      const emp = empResult.recordset[0];
      if (emp) await this.email.notificarSolicitudAprobada(idSolicitud, null, emp.nombre_completo, emp.correo);
    } catch (e) { console.error('Email error:', e.message); }

    return { status: 'success' };
  }

  async rechazar(idSolicitud, carnetRechaza, motivo, usuario) {
    const sql = this.db.getSql();
    const roles = usuario?.roles || [];

    const puedeAdmin = roles.includes('ADMIN');
    const puedeRRHH = roles.includes('RRHH_APRUEBA');

    if (!puedeAdmin && !puedeRRHH) {
      const solResult = await this.db.query(
        'SELECT EmpleadoCarnet FROM dbo.Solicitudes WHERE IdSolicitud=@id',
        [{ name: 'id', type: sql.BigInt, value: idSolicitud }]
      );
      if (solResult.recordset.length === 0) {
        throw new Error('Solicitud no encontrada');
      }
      const empleadoCarnet = solResult.recordset[0].EmpleadoCarnet;
      const puedeVer = await this.visibilidad.puedeVer(carnetRechaza, empleadoCarnet);
      if (!puedeVer && carnetRechaza !== 'SYSTEM') {
        throw new Error('No tiene permisos para rechazar esta solicitud');
      }
    }

    await this.db.execute('dbo.Sol_Rechazar', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'CarnetRechaza', type: sql.VarChar, value: carnetRechaza },
      { name: 'Motivo', type: sql.VarChar, value: motivo },
    ]);

    await this.audit.registrar('SOLICITUDES', 'RECHAZAR', carnetRechaza, null, 'Solicitud', idSolicitud?.toString(), null, { motivo });

    try {
      const empResult = await this.db.query(
        'SELECT e.nombre_completo, e.correo FROM dbo.vw_EmpleadosActivos e JOIN dbo.Solicitudes s ON s.EmpleadoCarnet=e.carnet WHERE s.IdSolicitud=@id',
        [{ name: 'id', type: sql.BigInt, value: idSolicitud }]
      );
      const emp = empResult.recordset[0];
      if (emp) await this.email.notificarSolicitudRechazada(idSolicitud, null, emp.nombre_completo, emp.correo, motivo);
    } catch (e) { console.error('Email error:', e.message); }

    return { status: 'success' };
  }
}
