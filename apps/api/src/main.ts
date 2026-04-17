import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security & compression
  app.use(helmet());
  app.use(compression());

  // CORS — allow tunnel domains in development
  const origins = config.get<string>('CORS_ORIGINS', 'http://localhost:8081');
  const isDev = config.get<string>('NODE_ENV', 'development') === 'development';
  app.enableCors({
    origin: isDev ? true : origins.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Spontaneous Social API')
    .setDescription('Backend API for the Spontaneous Social mobile app')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
