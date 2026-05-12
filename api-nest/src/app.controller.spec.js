import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController;
  let dbService;

  const mockDb = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    mockDb.query.mockReset();

    const app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    }).compile();

    appController = app.get(AppController);
    dbService = app.get(DatabaseService);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('should return db connected when query succeeds', async () => {
      mockDb.query.mockResolvedValue({ recordset: [{ ok: 1 }] });
      const result = await appController.health();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('connected');
    });

    it('should return db disconnected when query fails', async () => {
      mockDb.query.mockRejectedValue(new Error('DB down'));
      const result = await appController.health();
      expect(result.status).toBe('ok');
      expect(result.db).toBe('disconnected');
    });
  });
});
