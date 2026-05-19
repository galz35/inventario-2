import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { rateLimit } from './common/rate-limiter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie parser con secreto para cookies firmadas
  app.use(cookieParser(process.env.COOKIE_SECRET || 'inventario-portal-secret-dev'));

  // Rate limiting para auth
  app.use('/api/v1/auth/login', rateLimit({ windowMs: 60000, max: 10 }));
  app.use('/api/v1/auth/sso-login', rateLimit({ windowMs: 60000, max: 10 }));

  app.enableCors({
    origin: isProduction
      ? ['https://rhclaroni.com', 'https://www.rhclaroni.com']
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  const port = process.env.SERVER_PORT || process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port} (${isProduction ? 'production' : 'development'})`);
}
bootstrap();
