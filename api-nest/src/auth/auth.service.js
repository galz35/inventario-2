import { Injectable, Dependencies, UnauthorizedException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

@Injectable()
@Dependencies(DatabaseService, ConfigService)
export class AuthService {
  constructor(db, configService) {
    this.db = db;
    this.configService = configService;
    this.logger = new Logger(AuthService.name);
  }

  async validateSSOToken(token) {
    const primarySecret = String(this.configService.get('JWT_SSO_SECRET') || '').trim();
    const fallbackSecret = String(this.configService.get('JWT_SECRET') || '').trim();
    const secretCandidates = [primarySecret, fallbackSecret].filter(Boolean);
    if (secretCandidates.length === 0) {
      throw new Error('JWT_SSO_SECRET/JWT_SECRET no están configurados en el servidor');
    }

    try {
      let decoded = null;
      const verifyErrors = [];
      for (let i = 0; i < secretCandidates.length; i++) {
        try {
          decoded = jwt.verify(token, secretCandidates[i], { clockTolerance: 60 });
          break;
        } catch (err) {
          this.logger.warn(`[SSO] Attempt ${i + 1}/${secretCandidates.length} failed: ${err.name} - ${err.message}`);
          verifyErrors.push(err);
        }
      }
      if (!decoded) {
        const expiredErr = verifyErrors.find((e) => e && e.name === 'TokenExpiredError');
        throw expiredErr || verifyErrors[verifyErrors.length - 1] || new Error('No se pudo verificar el token');
      }
      
      const { carnet, username, type } = decoded;
      this.logger.log(`[SSO] Token válido para carnet=${carnet} type=${type}`);

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

      // Obtener roles
      const rolesRes = await this.db.query(
        'SELECT Rol FROM dbo.RolesSistema WHERE Carnet = @carnet AND Activo = 1',
        [{ name: 'carnet', type: sql.VarChar, value: carnet }]
      );
      const roles = rolesRes.recordset.map(r => r.Rol);

      // Retornar datos del usuario para establecer la sesión local
      return {
        carnet: user.carnet,
        nombre: user.nombre_completo,
        pais: user.pais,
        roles
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`[SSO] Error verificando token: ${err.name} - ${err.message}`);
      throw new UnauthorizedException('Token de SSO inválido o expirado');
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

    const rolesRes = await this.db.query(
      'SELECT Rol FROM dbo.RolesSistema WHERE Carnet = @carnet AND Activo = 1',
      [{ name: 'carnet', type: sql.VarChar, value: user.carnet }]
    );
    const roles = rolesRes.recordset.map(r => r.Rol);

    return {
      carnet: user.carnet,
      pais: user.pais,
      roles
    };
  }
  async validatePortalSession(sessionId) {
    if (!sessionId) return null;

    const portalUrl =
      this.configService.get('PORTAL_API_URL') || 'http://127.0.0.1:3110';
    try {
      const response = await axios.post(
        `${portalUrl.replace(/\/+$/, '')}/api/auth/introspect`,
        {},
        {
          headers: { Cookie: `portal_sid=${sessionId}` },
          timeout: 5000,
        },
      );

      if (response.data && response.data.authenticated) {
        const portalUser = response.data.identity || response.data.user;
        if (!portalUser) {
          return null;
        }

        const sql = this.db.getSql();
        const result = await this.db.query(
          `SELECT carnet, nombre_completo, pais 
           FROM dbo.vw_EmpleadosActivos 
           WHERE carnet = @carnet`,
          [{ name: 'carnet', type: sql.VarChar, value: portalUser.carnet }]
        );

        if (result.recordset.length === 0) {
          return null;
        }

        const user = result.recordset[0];

        const rolesRes = await this.db.query(
          'SELECT Rol FROM dbo.RolesSistema WHERE Carnet = @carnet AND Activo = 1',
          [{ name: 'carnet', type: sql.VarChar, value: user.carnet }]
        );
        const roles = rolesRes.recordset.map(r => r.Rol);

        return {
          carnet: user.carnet,
          nombre: user.nombre_completo,
          pais: user.pais,
          roles
        };
      }
    } catch (err) {
      this.logger.warn(`[PortalSession] Error contacting Portal: ${err.message}`);
    }
    return null;
  }

  async syncUserFromPortal(data) {
    console.log(`[SSO-SYNC] Forzando actualización en Inventario para usuario: ${data.carnet} (Aceptado)`);
    return true;
  }

  async getCurrentUser(carnet) {
    const sql = this.db.getSql();
    const result = await this.db.query(
      `SELECT carnet, nombre_completo, pais 
       FROM dbo.vw_EmpleadosActivos 
       WHERE carnet = @carnet`,
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );

    if (result.recordset.length === 0) {
      throw new UnauthorizedException(`Usuario ${carnet} no encontrado`);
    }

    const user = result.recordset[0];

    const rolesRes = await this.db.query(
      'SELECT Rol FROM dbo.RolesSistema WHERE Carnet = @carnet AND Activo = 1',
      [{ name: 'carnet', type: sql.VarChar, value: carnet }]
    );
    const roles = rolesRes.recordset.map(r => r.Rol);

    return {
      carnet: user.carnet,
      nombre: user.nombre_completo,
      pais: user.pais,
      roles
    };
  }
}
