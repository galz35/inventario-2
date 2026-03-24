import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class SolicitudesService {
  constructor(db) {
    this.db = db;
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

  async listar(estado, desde, hasta, pais) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Sol_Listar', [
      { name: 'Estado', type: sql.VarChar, value: estado || null },
      { name: 'Desde', type: sql.Date, value: desde || null },
      { name: 'Hasta', type: sql.Date, value: hasta || null },
      { name: 'Pais', type: sql.VarChar, value: pais || null },
    ]);
    return result.recordset;
  }

  async crear(empleadoCarnet, motivo, detalles) {
    const sql = this.db.getSql();
    // Detalles es un array de { idArticulo, talla, sexo, cantidad }
    const result = await this.db.execute('dbo.Sol_CrearSolicitud', [
      { name: 'EmpleadoCarnet', type: sql.VarChar, value: empleadoCarnet },
      { name: 'Motivo', type: sql.VarChar, value: motivo },
      { name: 'DetallesJson', type: sql.NVarChar, value: JSON.stringify(detalles) },
    ]);
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

  async aprobar(idSolicitud, carnetAprobador) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Sol_Aprobar', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'CarnetAprobador', type: sql.VarChar, value: carnetAprobador },
    ]);
    return { status: 'success' };
  }

  async rechazar(idSolicitud, carnetRechaza, motivo) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Sol_Rechazar', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'CarnetRechaza', type: sql.VarChar, value: carnetRechaza },
      { name: 'Motivo', type: sql.VarChar, value: motivo },
    ]);
    return { status: 'success' };
  }
}
