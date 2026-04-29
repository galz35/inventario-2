import { Injectable, ForbiddenException, Dependencies, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';

export const RequireRole = (role) => SetMetadata('role', role);

@Injectable()
@Dependencies(Reflector, DatabaseService)
export class RolesGuard {
  constructor(reflector, db) {
    this.reflector = reflector;
    this.db = db;
  }

  async canActivate(context) {
    const requiredRole = this.reflector.get('role', context.getHandler());
    if (!requiredRole) {
      return true; // Si no hay rol requerido, pasa
    }

    const request = context.switchToHttp().getRequest();
    const carnet = request.user?.carnet || request.cookies?.user_carnet;

    if (!carnet) {
      throw new ForbiddenException('No autenticado');
    }

    const sql = this.db.getSql();
    const result = await this.db.query(
      'SELECT 1 FROM dbo.RolesSistema WHERE Carnet = @carnet AND Rol = @rol AND Activo = 1',
      [
        { name: 'carnet', type: sql.VarChar, value: carnet },
        { name: 'rol', type: sql.VarChar, value: requiredRole }
      ]
    );

    if (result.recordset.length === 0) {
      throw new ForbiddenException(`Acceso denegado. Requiere el rol: ${requiredRole}`);
    }

    return true;
  }
}
