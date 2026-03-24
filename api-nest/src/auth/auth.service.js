import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

@Injectable()
@Dependencies(DatabaseService, ConfigService)
export class AuthService {
  constructor(db, configService) {
    this.db = db;
    this.configService = configService;
  }

  async validateSSOToken(token) {
    const SECRET = this.configService.get('JWT_SSO_SECRET');
    if (!SECRET) {
      throw new Error('JWT_SSO_SECRET no está configurado en el servidor');
    }

    try {
      const decoded = jwt.verify(token, SECRET, { clockTolerance: 10 });
      
      // Contrato de interfaz del Portal Central
      const { carnet, username, type } = decoded;

      if (type !== 'SSO_PORTAL') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      // Verificar si el carnet existe en la base de datos de empleados
      const sql = this.db.getSql();
      const result = await this.db.query(
        `SELECT carnet, nombre_completo, pais 
         FROM dbo.vw_EmpleadosActivos 
         WHERE carnet = @carnet`,
        [{ name: 'carnet', type: sql.VarChar, value: carnet }]
      );

      if (result.recordset.length === 0) {
        throw new UnauthorizedException(`El empleado con carnet ${carnet} no existe en este sistema o no está activo.`);
      }

      const user = result.recordset[0];

      // Retornar datos del usuario para establecer la sesión local
      return {
        carnet: user.carnet,
        nombre: user.nombre_completo,
        pais: user.pais
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error(`[SSO Inventario] Error de validación: ${err.message}`);
      throw new UnauthorizedException(`Token de SSO inválido o expirado: ${err.message}`);
    }
  }

  // Mantener login legacy solo si es necesario, pero priorizar SSO
  async login(username, password) {
    let detectedPais = 'NI';
    if (username.includes('@')) {
      const email = username.toLowerCase();
      if (email.endsWith('.ni')) detectedPais = 'NI';
      else if (email.endsWith('.gt')) detectedPais = 'GT';
      else if (email.endsWith('.hn')) detectedPais = 'HN';
      else if (email.endsWith('.sv')) detectedPais = 'SV';
      else if (email.endsWith('.cr')) detectedPais = 'CR';
    }

    const sql = this.db.getSql();
    const result = await this.db.query(
      `SELECT e.carnet, e.pais, s.PasswordHash 
       FROM dbo.vw_EmpleadosActivos e
       INNER JOIN dbo.UsuariosSeguridad s ON s.Carnet = e.carnet
       WHERE (e.carnet = @username OR e.correo = @username) AND e.pais = @pais AND s.Activo = 1`,
      [
        { name: 'username', type: sql.VarChar, value: username },
        { name: 'pais', type: sql.VarChar, value: detectedPais },
      ]
    );

    if (result.recordset.length === 0) {
      throw new UnauthorizedException('Usuario no encontrado o no autorizado');
    }

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    await this.db.query(
      'UPDATE dbo.UsuariosSeguridad SET UltimoAcceso=GETDATE() WHERE Carnet=@carnet',
      [{ name: 'carnet', type: sql.VarChar, value: user.carnet }]
    );

    return {
      carnet: user.carnet,
      pais: user.pais,
    };
  }
}
