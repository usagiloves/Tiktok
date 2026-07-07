import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('APP_PORT', 3000);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS for local development
  app.enableCors();

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📋 Health check: http://localhost:${port}/health`);
  logger.log(
    `🔗 TikTok OAuth: http://localhost:${port}/tiktok/oauth/authorize`,
  );
}

bootstrap();
