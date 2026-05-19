import { Controller, Get, Post, Body, Param, Query, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, RequireRole } from '../auth/roles.guard';

@Controller('api/v1/solicitudes')
@Dependencies(SolicitudesService)
@UseGuards(AuthGuard, RolesGuard)
export class SolicitudesController {
  constructor(solicitudesService) {
    this.solicitudesService = solicitudesService;
  }

  @Get('stats')
  @Bind(Query('idAlmacen'))
  async getStats(idAlmacen) {
    const data = await this.solicitudesService.dashboardKPIs(parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Get('recents')
  @Bind(Query('idAlmacen'))
  async getRecents(idAlmacen) {
    const data = await this.solicitudesService.ultimosMovimientos(parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Get()
  @Bind(Query('estado'), Query('desde'), Query('hasta'), Query('pais'), Req())
  async listar(estado, desde, hasta, pais, req) {
    const data = await this.solicitudesService.listar(estado, desde, hasta, pais, req.user);
    return { status: 'success', data };
  }

  @Post()
  @Bind(Body(), Req())
  async crear(body, req) {
    const { empleadoCarnet, motivo, detalles } = body;
    const data = await this.solicitudesService.crear(empleadoCarnet, motivo, detalles, req.user, req);
    return { status: 'success', data };
  }

  @Get(':id/detalle')
  @Bind(Param('id'), Query('idAlmacen'))
  async detalle(id, idAlmacen) {
    const data = await this.solicitudesService.obtenerDetalle(id, parseInt(idAlmacen));
    return { status: 'success', data };
  }

  @Post(':id/aprobar')
  @Bind(Param('id'), Body(), Req())
  async aprobar(id, body, req) {
    const carnet = req.user?.carnet || req.cookies?.user_carnet || 'SYSTEM';
    const result = await this.solicitudesService.aprobar(id, carnet, req.user);
    return result;
  }

  @Post(':id/rechazar')
  @Bind(Param('id'), Body(), Req())
  async rechazar(id, body, req) {
    const carnet = req.user?.carnet || req.cookies?.user_carnet || 'SYSTEM';
    const result = await this.solicitudesService.rechazar(id, carnet, body.motivo, req.user);
    return result;
  }
}
