import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../common/audit.service';

const mockAudit = {
  registrar: jest.fn().mockResolvedValue(undefined),
  listar: jest.fn().mockResolvedValue([]),
};

describe('AuthController', () => {
  let authController;
  let authService;
  let dbService;

  const mockDb = {
    getSql: jest.fn().mockReturnValue({ VarChar: 'VarChar' }),
    query: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key) => {
      if (key === 'JWT_SSO_SECRET') return 'test-sso-secret';
      if (key === 'JWT_SECRET') return 'test-jwt-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    authController = app.get(AuthController);
    authService = app.get(AuthService);
    dbService = app.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('logout', () => {
    it('should clear cookies and return success', async () => {
      const req = { cookies: {}, signedCookies: {} };
      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
      };

      await authController.logout(req, res);

      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith('user_carnet', '', expect.objectContaining({ maxAge: 0 }));
      expect(res.cookie).toHaveBeenCalledWith('user_pais', '', expect.objectContaining({ maxAge: 0 }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });
  });

  describe('me', () => {
    it('should return user data when authenticated', async () => {
      dbService.query
        .mockResolvedValueOnce({
          recordset: [{ carnet: '500708', nombre_completo: 'Test User', pais: 'NI' }],
        })
        .mockResolvedValueOnce({
          recordset: [{ Rol: 'ADMIN' }, { Rol: 'BODEGA' }],
        });

      const req = { cookies: { user_carnet: '500708', user_pais: 'NI' } };
      const res = { json: jest.fn() };

      await authController.me(req, res);

      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          carnet: '500708',
          pais: 'NI',
          nombre: 'Test User',
          roles: ['ADMIN', 'BODEGA'],
        },
      });
    });
  });
});
