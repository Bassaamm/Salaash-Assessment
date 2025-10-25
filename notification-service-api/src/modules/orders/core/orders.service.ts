import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from '../web/view/create-order.dto';
import { UpdateOrderDto } from '../web/view/update-order.dto';
import { QueryOrderDto } from '../web/view/query-order.dto';
import { RMQAdapter } from '../../../rmq/rmq.adapter';
import { EventType, EventNames } from '../../../rmq/event-types.enum';
import { Order } from './order.entity';
import { Channel } from '../../channels/core/channel.entity';
import { Notification } from '../../notifications/core/notification.entity';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import { NotificationStatus } from '../../../common/enums/notification-status.enum';
import { PaginatedResponseDto } from '../../../common/dto/pagination-response.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly rmqAdapter: RMQAdapter,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // 1. Save order to database
    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      total: createOrderDto.total,
      metadata: createOrderDto.metadata,
      notes: createOrderDto.notes,
      orderNumber: 'ORD-' + Date.now(),
    });

    const savedOrder = await this.orderRepository.save(order);

    this.logger.log(`Order created: ${savedOrder.orderNumber}`);

    // 2. Determine which channels to use
    let channelsToUse: Channel[];

    if (createOrderDto.channelIds && createOrderDto.channelIds.length > 0) {
      // Use specified channels
      channelsToUse = await this.channelRepository.find({
        where: createOrderDto.channelIds.map((id) => ({ id, isActive: true })),
      });
      this.logger.log(`Using ${channelsToUse.length} selected channels`);
    } else {
      // Use all active channels
      channelsToUse = await this.channelRepository.find({
        where: { isActive: true },
      });
      this.logger.log(`Using all ${channelsToUse.length} active channels`);
    }

    // 3. Send notifications through each channel and log them
    for (const channel of channelsToUse) {
      if (channel.type === NotificationChannel.EMAIL) {
        // Publish email notification event
        const emailEvent = {
          emails: [createOrderDto.userId], // Using userId as email
          context: 'order-confirmation',
          subject: 'Order Confirmation',
          body: `Your order #${savedOrder.orderNumber} has been created successfully!`,
          templateData: {
            customerName: 'Customer',
            orderId: savedOrder.orderNumber,
            orderDate: savedOrder.createdAt.toLocaleDateString(),
            items: [],
            total: savedOrder.total,
          },
          metadata: { orderId: savedOrder.id },
          channelId: channel.id,
        };

        await this.rmqAdapter.publish(
          emailEvent,
          EventType.email,
          EventNames.EMAIL_ORDER_CONFIRMATION,
        );

        // Log notification to database
        const notification = this.notificationRepository.create({
          recipientId: createOrderDto.userId,
          channelId: channel.id,
          templateName: 'order-confirmation',
          data: emailEvent.templateData,
          status: NotificationStatus.PENDING,
          idempotencyKey: `order-${savedOrder.id}-email-${channel.id}-${Date.now()}`,
        });
        await this.notificationRepository.save(notification);
        this.logger.log(
          `Email notification queued via channel: ${channel.name}`,
        );
      } else if (channel.type === NotificationChannel.SMS) {
        // Publish SMS notification event
        const smsEvent = {
          phoneNumbers: [createOrderDto.userId],
          message: `Order #${savedOrder.orderNumber} confirmed! Thank you for your purchase.`,
          context: 'order-sms',
          metadata: { orderId: savedOrder.id },
          channelId: channel.id,
        };

        await this.rmqAdapter.publish(
          smsEvent,
          EventType.sms,
          EventNames.SMS_NOTIFICATION,
        );

        // Log notification to database
        const notification = this.notificationRepository.create({
          recipientId: createOrderDto.userId,
          channelId: channel.id,
          templateName: 'order-sms',
          data: { orderId: savedOrder.orderNumber, total: savedOrder.total },
          status: NotificationStatus.PENDING,
          idempotencyKey: `order-${savedOrder.id}-sms-${channel.id}-${Date.now()}`,
        });
        await this.notificationRepository.save(notification);
        this.logger.log(`SMS notification queued via channel: ${channel.name}`);
      } else if (channel.type === NotificationChannel.PUSH) {
        // Publish Push notification event
        const pushEvent = {
          deviceTokens: [createOrderDto.userId],
          title: 'Order Confirmation',
          body: `Your order #${savedOrder.orderNumber} has been confirmed!`,
          data: { orderId: savedOrder.id, orderNumber: savedOrder.orderNumber },
          metadata: { orderId: savedOrder.id },
          channelId: channel.id,
        };

        await this.rmqAdapter.publish(
          pushEvent,
          EventType.push,
          EventNames.PUSH_NOTIFICATION,
        );

        // Log notification to database
        const notification = this.notificationRepository.create({
          recipientId: createOrderDto.userId,
          channelId: channel.id,
          templateName: 'order-push',
          data: { orderId: savedOrder.orderNumber, total: savedOrder.total },
          status: NotificationStatus.PENDING,
          idempotencyKey: `order-${savedOrder.id}-push-${channel.id}-${Date.now()}`,
        });
        await this.notificationRepository.save(notification);
        this.logger.log(
          `Push notification queued via channel: ${channel.name}`,
        );
      }
    }

    if (channelsToUse.length === 0) {
      this.logger.warn('No active channels found, no notifications sent');
    }

    return savedOrder;
  }

  async findAll(query: QueryOrderDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(order.userId ILIKE :search OR order.orderNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId });
    }

    // Apply sorting
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    return await this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.orderRepository.softRemove(order);
    return { message: `Order ${id} has been removed` };
  }
}
