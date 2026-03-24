import { Controller, Get, Post, Body, Query, Req, Dependencies, Bind } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('api/v1')
@Dependencies(InventoryService)
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
}
