import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class AuditService {
  constructor(db) {
    this.db = db;
  }

  async registrar(modulo, accion, carnetActor, carnetObjetivo = null, entidad = null, idEntidad = null, antes = null, despues = null, req = null) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Aud_Registrar', [
      { name: 'Modulo', type: sql.VarChar, value: modulo },
      { name: 'Accion', type: sql.VarChar, value: accion },
      { name: 'CarnetActor', type: sql.VarChar, value: carnetActor || null },
      { name: 'CarnetObjetivo', type: sql.VarChar, value: carnetObjetivo },
      { name: 'Entidad', type: sql.VarChar, value: entidad },
      { name: 'IdEntidad', type: sql.VarChar, value: idEntidad },
      { name: 'Antes', type: sql.NVarChar, value: antes ? JSON.stringify(antes) : null },
      { name: 'Despues', type: sql.NVarChar, value: despues ? JSON.stringify(despues) : null },
      { name: 'Ip', type: sql.VarChar, value: req?.ip || null },
      { name: 'UserAgent', type: sql.VarChar, value: req?.headers?.['user-agent'] || null },
    ]);
  }

  async listar(modulo, desde, hasta, carnetActor, top = 200) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Aud_Listar', [
      { name: 'Modulo', type: sql.VarChar, value: modulo || null },
      { name: 'Desde', type: sql.Date, value: desde || null },
      { name: 'Hasta', type: sql.Date, value: hasta || null },
      { name: 'CarnetActor', type: sql.VarChar, value: carnetActor || null },
      { name: 'Top', type: sql.Int, value: top },
    ]);
    return result.recordset;
  }
}
