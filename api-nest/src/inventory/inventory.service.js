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

  async pendientesDespacho(pais) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Bod_Pendientes', [
      { name: 'Pais', type: sql.VarChar, value: pais }
    ]);
    return result.recordset;
  }

  async despachar(idAlmacen, idSolicitud, carnetBodeguero, lineas) {
    const sql = this.db.getSql();
    await this.db.execute('dbo.Bod_Despachar', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'CarnetBodeguero', type: sql.VarChar, value: carnetBodeguero },
      { name: 'DespachoJson', type: sql.NVarChar, value: JSON.stringify(lineas) }
    ]);
    return { status: 'success' };
  }

  async preDespacho(idSolicitud, idAlmacen) {
    const sql = this.db.getSql();
    const detalle = await this.db.execute('dbo.Sol_DetalleConStock', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
    ]);

    const lineasConLotes = [];
    for (const linea of detalle.recordset) {
      const lotes = await this.db.execute('dbo.Inv_LotesPorArticulo', [
        { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
        { name: 'IdArticulo', type: sql.Int, value: linea.IdArticulo },
      ]);
      lineasConLotes.push({
        ...linea,
        lotesDisponibles: lotes.recordset,
      });
    }
    return lineasConLotes;
  }

  async obtenerLotes(idAlmacen, idArticulo) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_LotesPorArticulo', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'IdArticulo', type: sql.Int, value: idArticulo },
    ]);
    return result.recordset;
  }

  async alertasVencimiento(idAlmacen, dias) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_AlertasVencimiento', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
      { name: 'Dias', type: sql.Int, value: dias },
    ]);
    return result.recordset;
  }

  async alertasStockBajo(idAlmacen) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Inv_AlertasStockBajo', [
      { name: 'IdAlmacen', type: sql.Int, value: idAlmacen },
    ]);
    return result.recordset;
  }

  async guardarEvidencia(idSolicitud, idDetalle, nombreArchivo, tipoArchivo, contenidoBase64, carnet) {
    const sql = this.db.getSql();
    const result = await this.db.execute('dbo.Bod_GuardarEvidencia', [
      { name: 'IdSolicitud', type: sql.BigInt, value: idSolicitud },
      { name: 'IdDetalle', type: sql.BigInt, value: idDetalle || null },
      { name: 'NombreArchivo', type: sql.VarChar, value: nombreArchivo },
      { name: 'TipoArchivo', type: sql.VarChar, value: tipoArchivo },
      { name: 'ContenidoBase64', type: sql.VarChar, value: contenidoBase64 },
      { name: 'CarnetSubio', type: sql.VarChar, value: carnet },
    ]);
    return result.recordset[0];
  }
}
