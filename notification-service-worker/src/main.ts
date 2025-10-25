import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const port = process.env.PORT || 3333;
  await app.listen(port);
  
  Logger.log(`Worker service listening on http://localhost:${port}`);
  Logger.log('Worker is now processing events from RabbitMQ');
  Logger.log('Handlers registered: Email, SMS, Push Notifications');
}

bootstrap();
