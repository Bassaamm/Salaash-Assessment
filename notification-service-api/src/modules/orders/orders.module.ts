import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './core/orders.service';
import { OrdersController } from './web/orders.controller';
import { Order } from './core/order.entity';
import { Channel } from '../channels/core/channel.entity';
import { Notification } from '../notifications/core/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Channel, Notification])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
