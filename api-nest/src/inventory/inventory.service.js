import { Injectable, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class InventoryService {
  constructor(db) {
    this.db = db;
  }

  async listarAlmacenes(pais) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_ListarAlmacenes', [
      { name: 'Pais', type: sql.VarChar, value: pais }
    ]);
    return result.recordset;
  }

  async listarArticulos() {
    const result = await this.db.execute('dbo.Inv_ListarArticulos');
    return result.recordset;
  }

  async obtenerStock(idAlmacen) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_InventarioPorAlmacen', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen }
    ]);
    return result.recordset;
  }

  async registrarMovimiento(datos, usuario) {
    const sql = this.db.getSql();
    const { idAlmacen, tipo, idArticulo, talla, sexo, cantidad, comentario, lote, fechaVencimiento } = datos;
    
    await this.db.execute('dbo.Inv_Mov_EntradaMerma', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'Tipo', type: sql.VarChar, value: tipo },
      { name: 'IdArticulo', type: sql.Int, value: idArticulo },
      { name: 'Talla', type: sql.VarChar, value: talla },
      { name: 'Sexo', type: sql.VarChar, value: sexo },
      { name: 'Cantidad', type: sql.Int, value: cantidad },
      { name: 'Comentario', type: sql.VarChar, value: comentario },
      { name: 'Usuario', type: sql.VarChar, value: usuario },
      { name: 'LoteCodigo', type: sql.VarChar, value: lote || null },
      { name: 'Vence', type: sql.Date, value: fechaVencimiento || null }
    ]);
    
    return { status: 'success' };
  }

  async obtenerKardex(idAlmacen, desde, hasta, tipo, carnetDestino) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Kdx_Listar', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'Desde', type: sql.Date, value: desde },
      { name: 'Hasta', type: sql.Date, value: hasta },
      { name: 'Tipo', type: sql.VarChar, value: tipo || null },
      { name: 'CarnetDestino', type: sql.VarChar, value: carnetDestino || null }
    ]);
    return result.recordset;
  }
}
