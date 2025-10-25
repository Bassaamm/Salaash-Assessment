import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './web/notifications.controller';
import { NotificationsService } from './core/notifications.service';
import { Notification } from './core/notification.entity';
import { DeliveryLog } from './core/delivery-log.entity';
import { Channel } from '../channels/core/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, DeliveryLog, Channel])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
