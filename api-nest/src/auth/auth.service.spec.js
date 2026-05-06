import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService;
  let databaseService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            getSql: jest.fn().mockReturnValue({ VarChar: 'VarChar' }),
            query: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'JWT_SSO_SECRET') return 'test-sso-secret';
              if (key === 'JWT_SECRET') return 'test-jwt-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    databaseService = moduleRef.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should throw UnauthorizedException if user not found', async () => {
    databaseService.query.mockResolvedValue({ recordset: [] });

    await expect(authService.login('wrong', 'pass')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    const hashedPass = await bcrypt.hash('correct_pass', 10);
    databaseService.query.mockResolvedValue({
      recordset: [{ carnet: '500708', PasswordHash: hashedPass, pais: 'NI' }],
    });

    await expect(authService.login('500708', 'wrong_pass')).rejects.toThrow(UnauthorizedException);
  });

  it('should return user data on successful login', async () => {
    const hashedPass = await bcrypt.hash('correct_pass', 10);
    databaseService.query.mockResolvedValue({
      recordset: [{ carnet: '500708', PasswordHash: hashedPass, pais: 'NI' }],
    });

    const result = await authService.login('500708', 'correct_pass');
    expect(result.carnet).toBe('500708');
    expect(result.pais).toBe('NI');
    expect(Array.isArray(result.roles)).toBe(true);
  });
});
