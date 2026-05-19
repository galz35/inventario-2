import { Controller, Get, Post, Body, Query, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, RequireRole } from '../auth/roles.guard';
import { AuditService } from '../common/audit.service';

@Controller('api/v1/admin')
@Dependencies(AdminService, AuditService)
@UseGuards(AuthGuard, RolesGuard)
@RequireRole('ADMIN')
export class AdminController {
  constructor(adminService, audit) {
    this.adminService = adminService;
    this.audit = audit;
  }

  @Get('roles')
  async listarRoles() {
    const data = await this.adminService.listarRoles();
    return { status: 'success', data };
  }

  @Post('roles')
  @Bind(Body(), Req())
  async asignarRol(body, req) {
    const { carnet, rol, activo } = body;
    await this.audit.registrar('ADMIN', 'ASIGNAR_ROL', req.user?.carnet, carnet, 'RolesSistema', null, null, { rol, activo }, req);
    return this.adminService.asignarRol(carnet, rol, activo);
  }

  @Post('almacenes')
  @Bind(Body(), Req())
  async crearAlmacen(body, req) {
    const { codigo, nombre, pais } = body;
    await this.audit.registrar('ADMIN', 'CREAR_ALMACEN', req.user?.carnet, null, 'Almacenes', null, null, { codigo, nombre, pais }, req);
    const data = await this.adminService.crearAlmacen(codigo, nombre, pais);
    return { status: 'success', data };
  }

  @Post('articulos')
  @Bind(Body(), Req())
  async crearArticulo(body, req) {
    const { codigo, nombre, tipo, unidad } = body;
    await this.audit.registrar('ADMIN', 'CREAR_ARTICULO', req.user?.carnet, null, 'Articulos', null, null, { codigo, nombre, tipo, unidad }, req);
    const data = await this.adminService.crearArticulo(codigo, nombre, tipo, unidad);
    return { status: 'success', data };
  }

  @Post('transferencia')
  @Bind(Body(), Req())
  async transferencia(body, req) {
    const { idAlmacenOrigen, idAlmacenDestino, idArticulo, talla, sexo, cantidad } = body;
    const usuario = req.user?.carnet || 'SYSTEM';
    await this.audit.registrar('INVENTARIO', 'TRANSFERENCIA', usuario, null, 'MovimientosInventario', null, null, body, req);
    return this.adminService.transferencia(idAlmacenOrigen, idAlmacenDestino, idArticulo, talla, sexo, cantidad, usuario);
  }

  @Get('audit')
  @Bind(Query('modulo'), Query('desde'), Query('hasta'), Query('carnet'), Query('top'))
  async listarAudit(modulo, desde, hasta, carnet, top) {
    const data = await this.audit.listar(modulo, desde, hasta, carnet, parseInt(top) || 200);
    return { status: 'success', data };
  }
}
