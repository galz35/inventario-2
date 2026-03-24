import { Controller, Post, Body, Res, Dependencies, Bind } from '@nestjs/common';
import { AuthService } from './auth.service';

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
        nombre: user.nombre
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
      }
    });
  }
}
