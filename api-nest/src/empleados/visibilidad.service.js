import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class VisibilidadService {
  constructor(db) {
    this.db = db;
  }

  async obtenerCarnetsVisibles(carnet) {
    const sql = this.db.getSql();
    const result = await this.db.query(
      'SELECT carnet, fuente, nivel FROM dbo.Inv_Visibilidad_ObtenerCarnets(@carnet) ORDER BY nivel, carnet',
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );
    return result.recordset.map(r => r.carnet);
  }

  async puedeVer(carnetSolicitante, carnetObjetivo) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_Visibilidad_PuedeVer', [
      { name: 'CarnetSolicitante', type: sql.VarChar, value: carnetSolicitante },
      { name: 'CarnetObjetivo', type: sql.VarChar, value: carnetObjetivo },
    ]);
    return result.recordset[0]?.PuedeVer === true;
  }

  async obtenerActoresEfectivos(carnet) {
    const carnets = await this.obtenerCarnetsVisibles(carnet);
    return [...new Set([carnet, ...carnets])];
  }

  async esAdmin(carnet) {
    const sql = this.db.getSql();
    const result = await this.db.query(
      `SELECT COUNT(1) AS cnt FROM dbo.RolesSistema WHERE Carnet=@carnet AND Rol='ADMIN' AND Activo=1`,
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );
    return result.recordset[0]?.cnt > 0;
  }

  scopeSegunRol(usuario) {
    const roles = usuario.roles || [];
    if (roles.includes('ADMIN')) return 'TODO';
    if (roles.includes('BODEGA')) return 'PAIS';
    if (roles.includes('RRHH_APRUEBA')) return 'PAIS';
    if (usuario.carnet) return 'PROPIAS';
    return 'PROPIAS';
  }
}
