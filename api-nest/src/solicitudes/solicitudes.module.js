import { Module } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { EmpleadosModule } from '../empleados/empleados.module';

@Module({
  imports: [EmpleadosModule],
  providers: [SolicitudesService],
  controllers: [SolicitudesController],
})
export class SolicitudesModule {}
