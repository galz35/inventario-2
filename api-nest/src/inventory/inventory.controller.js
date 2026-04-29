import { Controller, Get, Post, Body, Query, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, RequireRole } from '../auth/roles.guard';

@Controller('api/v1')
@Dependencies(InventoryService)
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
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
    const usuario = req.cookies?.user_carnet || 'SYSTEM';
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
    const result = await this.inventoryService.despachar(idAlmacen, idSolicitud, carnetBodeguero, lineas);
    return result;
  }
}
