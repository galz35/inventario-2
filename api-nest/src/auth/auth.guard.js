import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
@Dependencies(DatabaseService)
export class AuthGuard {
  constructor(db) {
    this.db = db;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const carnet = request.cookies?.user_carnet;

    if (!carnet) {
      throw new UnauthorizedException('No autenticado. Falta cookie de sesión.');
    }

    const sql = this.db.getSql();
    const result = await this.db.query(
      'SELECT Activo FROM dbo.UsuariosSeguridad WHERE Carnet = @carnet',
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );

    if (result.recordset.length === 0 || !result.recordset[0].Activo) {
      throw new UnauthorizedException('Usuario inactivo o no existe en seguridad.');
    }

    // Adjuntar usuario al request (roles se cargan en RolesGuard si aplica)
    request.user = { carnet, pais: request.cookies?.user_pais, roles: [] };
    return true;
  }
}
