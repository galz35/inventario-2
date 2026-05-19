import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class AdminService {
  constructor(db) {
    this.db = db;
  }

  async listarRoles() {
    const result = await this.db.execute('dbo.Admin_ListarRoles');
    return result.recordset;
  }

  async asignarRol(carnet, rol, activo) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Admin_AsignarRol', [
      { name: 'Carnet', type: sql.VarChar, value: carnet },
      { name: 'Rol', type: sql.VarChar, value: rol },
      { name: 'Activo', type: sql.Bit, value: activo !== false },
    ]);
    return { status: 'success' };
  }

  async crearAlmacen(codigo, nombre, pais) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_CrearAlmacen', [
      { name: 'Codigo', type: sql.VarChar, value: codigo },
      { name: 'Nombre', type: sql.VarChar, value: nombre },
      { name: 'Pais', type: sql.VarChar, value: pais },
    ]);
    return result.recordset[0];
  }

  async crearArticulo(codigo, nombre, tipo, unidad) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_CrearArticulo', [
      { name: 'Codigo', type: sql.VarChar, value: codigo },
      { name: 'Nombre', type: sql.VarChar, value: nombre },
      { name: 'Tipo', type: sql.VarChar, value: tipo },
      { name: 'Unidad', type: sql.VarChar, value: unidad },
    ]);
    return result.recordset[0];
  }

  async transferencia(idAlmacenOrigen, idAlmacenDestino, idArticulo, talla, sexo, cantidad, usuario) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Inv_Mov_Transferencia', [
      { name: 'IdAlmacenOrigen', type: sql.Int, value: idAlmacenOrigen },
      { name: 'IdAlmacenDestino', type: sql.Int, value: idAlmacenDestino },
      { name: 'IdArticulo', type: sql.Int, value: idArticulo },
      { name: 'Talla', type: sql.VarChar, value: talla },
      { name: 'Sexo', type: sql.VarChar, value: sexo },
      { name: 'Cantidad', type: sql.Int, value: cantidad },
      { name: 'Usuario', type: sql.VarChar, value: usuario },
    ]);
    return { status: 'success' };
  }
}
