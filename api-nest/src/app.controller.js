import { Controller, Dependencies, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
@Dependencies(AppService, DatabaseService)
export class AppController {
  constructor(appService, db) {
    this.appService = appService;
    this.db = db;
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('api/v1/health')
  async health() {
    let dbOk = false;
    try {
      await this.db.query('SELECT 1 AS ok');
      dbOk = true;
    } catch {}
    return {
      status: 'ok',
      app: 'inventario-portal',
      version: process.env.npm_package_version || '0.0.1',
      db: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
