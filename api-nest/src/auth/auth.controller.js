import { Controller, Get, Post, Body, Res, Req, Dependencies, Bind, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('api/v1/auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('sso-login')
  @Bind(Body(), Res())
  async ssoLogin(body, res) {
    const { token } = body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token es requerido' });
    }

    const user = await this.authService.validateSSOToken(token);

    // Establecer cookies de sesión local persistentes (30 días)
    const cookieOptions = { 
      httpOnly: true, 
      sameSite: 'lax', 
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 
    };
    res.cookie('user_carnet', user.carnet, cookieOptions);
    res.cookie('user_pais', user.pais, cookieOptions);

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
  @Bind(Body(), Res())
  async login(body, res) {
    const { username, password } = body;
    const user = await this.authService.login(username, password);

    const cookieOptions = { 
      httpOnly: true, 
      sameSite: 'lax', 
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 
    };
    res.cookie('user_carnet', user.carnet, cookieOptions);
    res.cookie('user_pais', user.pais, cookieOptions);

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
    const sid = req.cookies?.portal_sid;
    if (!sid) {
      return res.status(401).json({ status: 'error', message: 'Sesión de Portal no detectada' });
    }

    const user = await this.authService.validatePortalSession(sid);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Sesión de Portal inválida o caducada' });
    }

    const cookieOptions = { 
      httpOnly: true, 
      sameSite: 'lax', 
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 
    };
    res.cookie('user_carnet', user.carnet, cookieOptions);
    res.cookie('user_pais', user.pais, cookieOptions);

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
  @Bind(Res())
  async logout(res) {
    const clearOptions = { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 };
    res.cookie('user_carnet', '', clearOptions);
    res.cookie('user_pais', '', clearOptions);
    return res.json({ status: 'success', message: 'Sesion cerrada' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @Bind(Req(), Res())
  async me(req, res) {
    const carnet = req.cookies?.user_carnet;
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
