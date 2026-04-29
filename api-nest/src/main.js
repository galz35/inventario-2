import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: ['https://inventario.rhclaroni.com', 'http://localhost:5173'],
    credentials: true,
  });
  const port = process.env.SERVER_PORT || process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 Server running on: http://localhost:${port}`);
}
bootstrap();
