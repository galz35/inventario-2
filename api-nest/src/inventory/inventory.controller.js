import { Controller, Get, Post, Body, Param, Query, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, RequireRole } from '../auth/roles.guard';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../common/email.service';
import { DatabaseService } from '../database/database.service';

@Controller('api/v1')
@Dependencies(InventoryService, AuditService, EmailService, DatabaseService)
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(inventoryService, audit, email, db) {
    this.inventoryService = inventoryService;
    this.audit = audit;
    this.email = email;
    this.db = db;
  }

  @Get('almacenes')
  @Bind(Query('pais'))
  async getAlmacenes(pais) {
    const data = await this.inventoryService.listarAlmacenes(pais);
    return { status: 'success', data };
  }

  @Get('articulos')
  async getArticulos() {
    const data = await this.inventoryService.listarArticulos();
    return { status: 'success', data };
  }

  @Get('inventario')
  @Bind(Query('idAlmacen'))
  async getStock(idAlmacen) {
    const data = await this.inventoryService.obtenerStock(parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Post('inventario/movimiento')
  @Bind(Body(), Req())
  @RequireRole('BODEGA')
  async registrarMovimiento(body, req) {
    const usuario = req.user?.carnet || req.cookies?.user_carnet || 'SYSTEM';
    await this.audit.registrar('INVENTARIO', body.tipo === 'ENTRADA' ? 'ENTRADA' : 'MERMA', usuario, null, 'MovimientosInventario', null, null, body, req);
    const result = await this.inventoryService.registrarMovimiento(body, usuario);
    return result;
  }

  @Get('kardex')
  @Bind(Query('idAlmacen'), Query('desde'), Query('hasta'), Query('tipo'), Query('carnetDestino'))
  async getKardex(idAlmacen, desde, hasta, tipo, carnetDestino) {
    const data = await this.inventoryService.obtenerKardex(
      parseInt(idAlmacen), 
      desde, 
      hasta, 
      tipo, 
      carnetDestino
    );
    return { status: 'success', data };
  }

  @Get('bodega/pendientes')
  @RequireRole('BODEGA')
  @Bind(Query('pais'))
  async getBodegaPendientes(pais) {
    const data = await this.inventoryService.pendientesDespacho(pais);
    return { status: 'success', data };
  }

  @Post('bodega/despachar')
  @RequireRole('BODEGA')
  @Bind(Body(), Req())
  async despachar(body, req) {
    const { idAlmacen, idSolicitud, lineas } = body;
    const carnetBodeguero = req.user?.carnet || req.cookies?.user_carnet || 'SYSTEM';
    await this.audit.registrar('BODEGA', 'DESPACHAR', carnetBodeguero, null, 'Solicitud', idSolicitud?.toString(), null, { lineas }, req);
    const result = await this.inventoryService.despachar(idAlmacen, idSolicitud, carnetBodeguero, lineas);

    // Notificar al empleado del despacho
    try {
      const sql = this.db.getSql();
      const empResult = await this.db.query(
        'SELECT e.nombre_completo, e.correo, s.Estado FROM dbo.vw_EmpleadosActivos e JOIN dbo.Solicitudes s ON s.EmpleadoCarnet=e.carnet WHERE s.IdSolicitud=@id',
        [{ name: 'id', type: sql.BigInt, value: idSolicitud }]
      );
      const emp = empResult.recordset[0];
      if (emp) await this.email.notificarSolicitudDespachada(idSolicitud, null, emp.nombre_completo, emp.correo, emp.Estado);
    } catch (e) { console.error('Email error:', e.message); }

    return result;
  }

  @Get('bodega/solicitudes/:id/pre-despacho')
  @RequireRole('BODEGA')
  @Bind(Param('id'), Query('idAlmacen'))
  async preDespacho(id, idAlmacen) {
    const data = await this.inventoryService.preDespacho(id, parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Get('inventario/lotes')
  @Bind(Query('idAlmacen'), Query('idArticulo'))
  async getLotes(idAlmacen, idArticulo) {
    const data = await this.inventoryService.obtenerLotes(parseInt(idAlmacen), parseInt(idArticulo));
    return { status: 'success', data };
  }

  @Get('inventario/alertas/vencimiento')
  @Bind(Query('idAlmacen'), Query('dias'))
  async alertasVencimiento(idAlmacen, dias) {
    const data = await this.inventoryService.alertasVencimiento(parseInt(idAlmacen), parseInt(dias) || 30);
    return { status: 'success', data };
  }

  @Get('inventario/alertas/stock-bajo')
  @Bind(Query('idAlmacen'))
  async alertasStockBajo(idAlmacen) {
    const data = await this.inventoryService.alertasStockBajo(parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Post('bodega/evidencia')
  @RequireRole('BODEGA')
  @Bind(Body(), Req())
  async guardarEvidencia(body, req) {
    const { idSolicitud, idDetalle, nombreArchivo, tipoArchivo, contenidoBase64 } = body;
    const carnet = req.user?.carnet || 'SYSTEM';
    await this.audit.registrar('BODEGA', 'EVIDENCIA', carnet, null, 'DespachoEvidencias', idSolicitud?.toString(), null, { nombreArchivo, tipoArchivo }, req);
    return this.inventoryService.guardarEvidencia(idSolicitud, idDetalle, nombreArchivo, tipoArchivo, contenidoBase64, carnet);
  }
}
