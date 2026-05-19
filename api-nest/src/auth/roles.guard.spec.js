import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard, RequireRole } from './roles.guard';
import { DatabaseService } from '../database/database.service';

describe('RolesGuard', () => {
  let guard;
  let dbService;

  const mockDb = {
    getSql: jest.fn().mockReturnValue({ VarChar: 'VarChar', Int: 'Int' }),
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    guard = module.get(RolesGuard);
    dbService = module.get(DatabaseService);
  });

  function createContext(handlerMetadata) {
    const handler = () => {};
    if (handlerMetadata) {
      Reflect.defineMetadata('roles', handlerMetadata.roles, handler);
    }
    return {
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => handlerMetadata?.request || { user: { carnet: '500708', roles: [] } },
      }),
    };
  }

  it('should allow access when no role is required', async () => {
    const ctx = createContext({ request: { user: { carnet: '500708', roles: [] } } });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should allow ADMIN user for any required role', async () => {
    dbService.query.mockResolvedValueOnce({
      recordset: [{ Rol: 'ADMIN' }],
    });
    Reflect.defineMetadata('roles', ['BODEGA'], createContext({}).getHandler());
    const ctx = createContext({
      roles: ['BODEGA'],
      request: { user: { carnet: '500708', roles: [] } },
    });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(dbService.query).toHaveBeenCalled();
  });

  it('should allow user with matching role', async () => {
    dbService.query.mockResolvedValueOnce({
      recordset: [{ Rol: 'BODEGA' }],
    });
    const ctx = createContext({
      roles: ['BODEGA'],
      request: { user: { carnet: '500708', roles: [] } },
    });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', async () => {
    dbService.query.mockResolvedValueOnce({
      recordset: [{ Rol: 'RRHH_APRUEBA' }],
    });
    const ctx = createContext({
      roles: ['BODEGA'],
      request: { user: { carnet: '500708', roles: [] } },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when no user', async () => {
    const ctx = createContext({
      roles: ['BODEGA'],
      request: { user: null },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow access when user has one of multiple required roles', async () => {
    dbService.query.mockResolvedValueOnce({
      recordset: [{ Rol: 'ADMIN' }, { Rol: 'BODEGA' }],
    });
    const ctx = createContext({
      roles: ['RRHH_APRUEBA', 'BODEGA'],
      request: { user: { carnet: '500708', roles: [] } },
    });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
