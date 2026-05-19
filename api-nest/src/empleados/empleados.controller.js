import { Controller, Get, Post, Param, Query, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, RequireRole } from '../auth/roles.guard';

@Controller('api/v1/empleados')
@Dependencies(EmpleadosService)
@UseGuards(AuthGuard, RolesGuard)
export class EmpleadosController {
  constructor(empleadosService) {
    this.empleadosService = empleadosService;
  }

  @Get()
  @Bind(Query('q'), Query('pais'), Req())
  async buscar(q, pais, req) {
    const data = await this.empleadosService.buscar(q, pais, req.user);
    return { status: 'success', data };
  }

  @Get('me')
  @Bind(Req())
  async getMe(req) {
    const data = await this.empleadosService.obtener(req.user.carnet);
    return { status: 'success', data };
  }

  @Get('me/equipo')
  @Bind(Req())
  async getMiEquipo(req) {
    const data = await this.empleadosService.obtenerEquipo(req.user.carnet);
    return { status: 'success', data };
  }

  @Get(':carnet')
  @Bind(Param('carnet'))
  async obtener(carnet) {
    const data = await this.empleadosService.obtener(carnet);
    return { status: 'success', data };
  }

  @Get(':carnet/equipo')
  @Bind(Param('carnet'))
  @RequireRole('ADMIN', 'RRHH_APRUEBA')
  async obtenerEquipo(carnet) {
    const data = await this.empleadosService.obtenerEquipo(carnet);
    return { status: 'success', data };
  }

  @Get(':carnet/puede-ver/:objetivo')
  @Bind(Param('carnet'), Param('objetivo'))
  async puedeVer(carnet, objetivo) {
    const data = await this.empleadosService.puedeVer(carnet, objetivo);
    return { status: 'success', data };
  }
}
