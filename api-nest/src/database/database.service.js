import { Injectable, Dependencies, Logger } from '@nestjs/common';
import sql from 'mssql';
import { ConfigService } from '@nestjs/config';

@Injectable()
@Dependencies(ConfigService)
export class DatabaseService {
  constructor(configService) {
    this.configService = configService;
    this.logger = new Logger(DatabaseService.name);
    this.pool = null;
  }

  async onModuleInit() {
    const config = {
      user: this.configService.get('MSSQL_USER'),
      password: this.configService.get('MSSQL_PASSWORD'),
      server: this.configService.get('MSSQL_HOST'),
      database: this.configService.get('MSSQL_DATABASE'),
      port: parseInt(this.configService.get('MSSQL_PORT')),
      options: {
        encrypt: this.configService.get('MSSQL_ENCRYPT') === 'true',
        trustServerCertificate: this.configService.get('MSSQL_TRUST_CERT') === 'true',
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    try {
      this.pool = await new sql.ConnectionPool(config).connect();
      this.logger.log('✅ Connected to SQL Server');
    } catch (err) {
      this.logger.error('❌ Database connection failed', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.close();
    }
  }

  async query(query, params = []) {
    const request = this.pool.request();
    params.forEach(p => {
      request.input(p.name, p.type || sql.NVarChar, p.value);
    });
    return request.query(query);
  }

  async execute(spName, params = []) {
    const request = this.pool.request();
    params.forEach(p => {
      request.input(p.name, p.type || sql.NVarChar, p.value);
    });
    return request.execute(spName);
  }

  getSql() {
    return sql;
  }
}
