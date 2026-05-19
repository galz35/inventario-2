import { Injectable, ForbiddenException, Dependencies, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';

export const RequireRole = (...roles) => SetMetadata('roles', roles);

@Injectable()
@Dependencies(Reflector, DatabaseService)
export class RolesGuard {
  constructor(reflector, db) {
    this.reflector = reflector;
    this.db = db;
  }

  async canActivate(context) {
    const requiredRoles = this.reflector.get('roles', context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const carnet = request.user?.carnet || request.cookies?.user_carnet;

    if (!carnet) {
      throw new ForbiddenException('No autenticado');
    }

    const sql = this.db.getSql();
    const rolesResult = await this.db.query(
      `SELECT Rol FROM dbo.RolesSistema WHERE Carnet=@carnet AND Activo=1`,
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );

    const userRoles = rolesResult.recordset.map(r => r.Rol);

    // ADMIN es superrol: pasa cualquier RequireRole
    if (userRoles.includes('ADMIN')) {
      request.user.roles = userRoles;
      return true;
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const tieneRol = requiredRoles.some(rol => userRoles.includes(rol));
    if (!tieneRol) {
      throw new ForbiddenException(`Acceso denegado. Requiere rol: ${requiredRoles.join(' o ')}`);
    }

    request.user.roles = userRoles;
    return true;
  }
}
