import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global serialization interceptor
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation only shows in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Notification Service API')
      .setDescription(
        'API for managing notifications, orders, channels, and templates',
      )
      .setVersion('1.0')
      .addTag('notifications')
      .addTag('orders')
      .addTag('channels')
      .addTag('templates')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(port, () => {
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API endpoints: http://localhost:${port}/api`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Swagger documentation: http://localhost:${port}/docs`);
    }
  });
}
bootstrap();
