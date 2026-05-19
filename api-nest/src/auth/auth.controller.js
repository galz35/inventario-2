import { Controller, Get, Post, Body, Res, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { AuditService } from '../common/audit.service';

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  signed: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const clearOpts = () => ({
  httpOnly: true, sameSite: 'lax', path: '/',
  secure: process.env.NODE_ENV === 'production',
  signed: process.env.NODE_ENV === 'production',
  maxAge: 0,
});

@Controller('api/v1/auth')
@Dependencies(AuthService, AuditService)
export class AuthController {
  constructor(authService, audit) {
    this.authService = authService;
    this.audit = audit;
  }

  @Post('sso-login')
  @Bind(Body(), Req(), Res())
  async ssoLogin(body, req, res) {
    const { token } = body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token es requerido' });
    }

    const user = await this.authService.validateSSOToken(token);

    res.cookie('user_carnet', user.carnet, cookieOpts());
    res.cookie('user_pais', user.pais, cookieOpts());

    await this.audit.registrar('AUTH', 'SSO_LOGIN', user.carnet, null, null, null, null, null, req);

    return res.json({
      status: 'success',
      data: {
        carnet: user.carnet,
        pais: user.pais,
        nombre: user.nombre,
        roles: user.roles
      }
    });
  }

  @Post('login')
  @Bind(Body(), Req(), Res())
  async login(body, req, res) {
    const { username, password } = body;
    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Usuario y contraseña requeridos' });
    }
    const user = await this.authService.login(username, password);

    res.cookie('user_carnet', user.carnet, cookieOpts());
    res.cookie('user_pais', user.pais, cookieOpts());

    await this.audit.registrar('AUTH', 'LOGIN', user.carnet, null, null, null, null, null, req);

    return res.json({
      status: 'success',
      data: {
        carnet: user.carnet,
        pais: user.pais,
        roles: user.roles
      }
    });
  }

  @Post('portal-session')
  @Bind(Req(), Res())
  async portalSession(req, res) {
    const sid = req.signedCookies?.portal_sid || req.cookies?.portal_sid;
    if (!sid) {
      return res.status(401).json({ status: 'error', message: 'Sesión de Portal no detectada' });
    }

    const user = await this.authService.validatePortalSession(sid);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Sesión de Portal inválida o caducada' });
    }

    res.cookie('user_carnet', user.carnet, cookieOpts());
    res.cookie('user_pais', user.pais, cookieOpts());

    await this.audit.registrar('AUTH', 'PORTAL_SESSION', user.carnet, null, null, null, null, null, req);

    return res.json({
      status: 'success',
      data: {
        carnet: user.carnet,
        pais: user.pais,
        nombre: user.nombre,
        roles: user.roles
      }
    });
  }

  @Post('sso-sync-user')
  @Bind(Body(), Res())
  async ssoSyncUser(body, res) {
    if (!body.carnet) {
      return res.status(400).json({ status: 'error', message: 'Carnet es requerido' });
    }
    const result = await this.authService.syncUserFromPortal(body);
    return res.json({ success: result });
  }

  @Post('logout')
  @Bind(Req(), Res())
  async logout(req, res) {
    const carnet = req.cookies?.user_carnet || req.signedCookies?.user_carnet;
    res.cookie('user_carnet', '', clearOpts());
    res.cookie('user_pais', '', clearOpts());
    await this.audit.registrar('AUTH', 'LOGOUT', carnet, null, null, null, null, null, req);
    return res.json({ status: 'success', message: 'Sesion cerrada' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @Bind(Req(), Res())
  async me(req, res) {
    const carnet = req.cookies?.user_carnet || req.signedCookies?.user_carnet;
    const user = await this.authService.getCurrentUser(carnet);
    return res.json({
      status: 'success',
      data: {
        carnet: user.carnet,
        pais: user.pais,
        nombre: user.nombre,
        roles: user.roles
      }
    });
  }
}
