import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';
import { EmailService } from '../../services/email.service';
import { TemplateService } from '../../services/template.service';
import { Channel } from '../../entities/channel.entity';
import { Notification } from '../../entities/notification.entity';
import { Order } from '../../entities/order.entity';

interface EmailNotificationEvent {
  emails: string[];
  orderId: string; // Order ID to fetch data
  templateName?: string;
  metadata?: Record<string, any>;
  channelId?: string;
}

@Injectable()
export class EmailOrderConfirmationHandler {
  private readonly logger = new Logger(EmailOrderConfirmationHandler.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @RabbitSubscribe({
    exchange: EventType.email,
    routingKey: EventNames.EMAIL_ORDER_CONFIRMATION,
    queue: 'EmailOrderConfirmationHandler',
    errorHandler: RMQErrorHandler('EmailOrderConfirmationHandler'),
  })
  async handle(event: EmailNotificationEvent): Promise<void> {
    const { emails, orderId, templateName, channelId } = event;

    try {
      this.logger.log(
        `Processing order confirmation email for order: ${orderId}`,
      );
      this.logger.log(`Recipients: ${emails.join(', ')}`);

      // Fetch order data from database
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      this.logger.log(`Order found: ${order.orderNumber}`);

      // Get channel configuration
      let channelConfig: Record<string, any> | undefined;
      if (channelId) {
        const channel = await this.channelRepository.findOne({
          where: { id: channelId, isActive: true },
        });

        if (channel) {
          this.logger.log(`Using channel: ${channel.name} (${channel.type})`);
          channelConfig = channel.configuration;
        } else {
          this.logger.warn(
            `Channel ${channelId} not found or inactive, using default config`,
          );
        }
      }

      // Prepare template data from order
      const templateData = {
        orderNumber: order.orderNumber,
        price: `$${Number(order.total).toFixed(2)}`,
        notes: order.notes || 'No additional notes',
      };

      this.logger.log(`Template data prepared:`, templateData);

      // Render template with order data
      const { subject, html } = await this.templateService.renderEmail(
        templateName || 'order-created',
        templateData,
      );

      // Send email with rendered content
      await this.emailService.sendEmail(
        emails,
        subject,
        html,
        null,
        null,
        channelConfig,
      );

      this.logger.log(`Order confirmation email sent successfully`);

      // Update notification status in database if notificationId is provided
      if (event.metadata?.notificationId) {
        try {
          await this.notificationRepository.update(
            event.metadata.notificationId,
            {
              status: 'sent',
              sentAt: new Date(),
            },
          );
          this.logger.log(
            `Notification ${event.metadata.notificationId} marked as sent`,
          );
        } catch (dbError) {
          this.logger.warn(`Failed to update notification status`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send order confirmation: ${error.message}`);

      // Update notification status to failed if notificationId is provided
      if (event.metadata?.notificationId) {
        try {
          await this.notificationRepository.update(
            event.metadata.notificationId,
            {
              status: 'failed',
              failedAt: new Date(),
              errorMessage: error.message,
            },
          );
          this.logger.log(
            `Notification ${event.metadata.notificationId} marked as failed`,
          );
        } catch (dbError) {
          this.logger.warn(`Failed to update notification failure status: `);
        }
      }

      throw error;
    }
  }
}
