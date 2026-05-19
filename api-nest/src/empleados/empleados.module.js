import { Module } from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { EmpleadosController } from './empleados.controller';
import { VisibilidadService } from './visibilidad.service';

@Module({
  providers: [EmpleadosService, VisibilidadService],
  controllers: [EmpleadosController],
  exports: [VisibilidadService],
})
export class EmpleadosModule {}
