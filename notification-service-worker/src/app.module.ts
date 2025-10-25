import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RMQAdapterModule } from './rmq/rmq-adapter.module';
import { HandlersModule } from './handlers/handlers.module';
import { Channel } from './entities/channel.entity';
import { Notification } from './entities/notification.entity';
import { Template } from './entities/template.entity';
import { Order } from './entities/order.entity';
import { TemplateService } from './services/template.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Channel, Notification, Template, Order],
        synchronize: false,
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Channel, Notification, Template, Order]),
    RMQAdapterModule,
    HandlersModule,
  ],
  controllers: [AppController],
  providers: [AppService, TemplateService],
  exports: [TemplateService],
})
export class AppModule {}
