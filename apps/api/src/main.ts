import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
    bodyParser: false,
  });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: isProduction
      ? [process.env.FRONTEND_URL!]
      : [
          'http://localhost:3000',
          'http://localhost:4000',
          'https://hottish-lyrically-kristopher.ngrok-free.dev',
        ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const logger = new Logger('Bootstrap');

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;

  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on port ${port}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

  logger.log(`🚀 Application started successfully`);
  logger.log(`📡 Server listening on port: ${port}`);
  logger.log(`🔐 CORS enabled for configured origins`);
  logger.log(`🛡️ Helmet security headers enabled`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Failed to start application', error.stack);
  process.exit(1);
});
