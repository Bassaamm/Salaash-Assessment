import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from '../web/view';
import { UpdateNotificationDto } from '../web/view';
import { QueryNotificationDto } from '../web/view/query-notification.dto';
import { Notification } from './notification.entity';
import { Channel } from '../../channels/core/channel.entity';
import { PaginatedResponseDto } from '../../../common/dto/pagination-response.dto';
import { RMQAdapter } from '../../../rmq/rmq.adapter';
import { EventType, EventNames } from '../../../rmq/event-types.enum';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly rmqAdapter: RMQAdapter,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // Check for idempotency
    const existing = await this.notificationRepository.findOne({
      where: { idempotencyKey: createNotificationDto.idempotencyKey },
    });

    if (existing) {
      throw new ConflictException(
        'Notification with this idempotency key already exists',
      );
    }

    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Fetch channel to determine type and publish appropriate event
    const channel = await this.channelRepository.findOne({
      where: { id: createNotificationDto.channelId },
    });

    if (!channel) {
      this.logger.warn(`Channel ${createNotificationDto.channelId} not found`);
      return savedNotification;
    }

    this.logger.log(
      `Publishing notification via channel: ${channel.name} (${channel.type})`,
    );

    // Publish event based on channel type
    if (channel.type === NotificationChannel.EMAIL) {
      const emailEvent = {
        emails: [createNotificationDto.recipientId],
        context: createNotificationDto.templateName || 'notification',
        subject: `Notification: ${createNotificationDto.templateName}`,
        body:
          createNotificationDto.data.message || 'You have a new notification',
        templateData: createNotificationDto.data,
        metadata: { notificationId: savedNotification.id },
        channelId: channel.id,
      };

      await this.rmqAdapter.publish(
        emailEvent,
        EventType.email,
        EventNames.EMAIL_NOTIFICATION,
      );
      this.logger.log(
        `Email event published for notification ${savedNotification.id}`,
      );
    } else if (channel.type === NotificationChannel.SMS) {
      const smsEvent = {
        phoneNumbers: [createNotificationDto.recipientId],
        message:
          createNotificationDto.data.message || 'You have a new notification',
        context: createNotificationDto.templateName,
        metadata: { notificationId: savedNotification.id },
        channelId: channel.id,
      };

      await this.rmqAdapter.publish(
        smsEvent,
        EventType.sms,
        EventNames.SMS_NOTIFICATION,
      );
      this.logger.log(
        `SMS event published for notification ${savedNotification.id}`,
      );
    } else if (channel.type === NotificationChannel.PUSH) {
      const pushEvent = {
        deviceTokens: [createNotificationDto.recipientId],
        title: createNotificationDto.templateName,
        body:
          createNotificationDto.data.message || 'You have a new notification',
        data: createNotificationDto.data,
        metadata: { notificationId: savedNotification.id },
        channelId: channel.id,
      };

      await this.rmqAdapter.publish(
        pushEvent,
        EventType.push,
        EventNames.PUSH_NOTIFICATION,
      );
      this.logger.log(
        `Push event published for notification ${savedNotification.id}`,
      );
    }

    return savedNotification;
  }

  async findAll(query: QueryNotificationDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      recipientId,
      channelId,
      templateName,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.channel', 'channel');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('notification.recipientId ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (recipientId) {
      queryBuilder.andWhere('notification.recipientId = :recipientId', {
        recipientId,
      });
    }

    if (channelId) {
      queryBuilder.andWhere('notification.channelId = :channelId', {
        channelId,
      });
    }

    if (templateName) {
      queryBuilder.andWhere('notification.templateName = :templateName', {
        templateName,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['channel'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const notification = await this.findOne(id);

    Object.assign(notification, updateNotificationDto);

    return await this.notificationRepository.save(notification);
  }

  async remove(id: string) {
    const notification = await this.findOne(id);
    await this.notificationRepository.softRemove(notification);
    return { message: `Notification ${id} has been removed` };
  }
}
