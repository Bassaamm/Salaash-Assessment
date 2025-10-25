import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { RedisModule } from './shared/redis/redis.module';
import { RMQAdapterModule } from './rmq/rmq-adapter.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    SharedModule,
    RedisModule,
    RMQAdapterModule,
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (config: ApiConfigService) => config.dbConfig,
      inject: [ApiConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (config: ApiConfigService) => config.mailConfig,
      inject: [ApiConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    NotificationsModule,
    OrdersModule,
    ChannelsModule,
    TemplatesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
