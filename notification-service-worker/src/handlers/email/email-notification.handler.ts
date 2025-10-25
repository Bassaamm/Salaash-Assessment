import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';
import { EmailService } from '../../services/email.service';

interface EmailNotificationEvent {
  emails: string[];
  context: string;
  subject: string;
  body: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class EmailNotificationHandler {
  private readonly logger = new Logger(EmailNotificationHandler.name);

  constructor(private readonly emailService: EmailService) {}

  @RabbitSubscribe({
    exchange: EventType.email,
    routingKey: EventNames.EMAIL_NOTIFICATION,
    queue: 'EmailNotificationHandler',
    errorHandler: RMQErrorHandler('EmailNotificationHandler'),
  })
  async handle(event: EmailNotificationEvent): Promise<void> {
    const { emails, context, subject, body, templateData } = event;
    try {
      this.logger.log(`Processing email notification: ${context}`);
      this.logger.log(`Recipients: ${emails.join(', ')}`);

      const templateName = 'notification';

      await this.emailService.sendEmail(
        emails,
        subject,
        body,
        templateName,
        templateData,
      );

      this.logger.log(`Email notification sent successfully: ${context}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification`);
      throw error;
    }
  }
}
