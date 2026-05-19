import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class EmpleadosService {
  constructor(db) {
    this.db = db;
  }

  async buscar(query, pais, usuario) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Emp_Buscar', [
      { name: 'Query', type: sql.VarChar, value: query || '' },
      { name: 'Pais', type: sql.VarChar, value: pais || null },
    ]);
    return result.recordset;
  }

  async obtener(carnet) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Emp_Obtener', [
      { name: 'Carnet', type: sql.VarChar, value: carnet },
    ]);
    return result.recordset[0] || null;
  }

  async obtenerEquipo(carnet) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_Visibilidad_ObtenerMiEquipo', [
      { name: 'CarnetSolicitante', type: sql.VarChar, value: carnet },
    ]);
    return result.recordset;
  }

  async puedeVer(carnetSolicitante, carnetObjetivo) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_Visibilidad_PuedeVer', [
      { name: 'CarnetSolicitante', type: sql.VarChar, value: carnetSolicitante },
      { name: 'CarnetObjetivo', type: sql.VarChar, value: carnetObjetivo },
    ]);
    return result.recordset[0];
  }
}
