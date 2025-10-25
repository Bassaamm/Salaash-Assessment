import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';

interface SmsNotificationEvent {
  phoneNumbers: string[];
  message: string;
  context: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SmsNotificationHandler {
  private readonly logger = new Logger(SmsNotificationHandler.name);

  @RabbitSubscribe({
    exchange: EventType.sms,
    routingKey: EventNames.SMS_NOTIFICATION,
    queue: 'SmsNotificationHandler',
    errorHandler: RMQErrorHandler('SmsNotificationHandler'),
  })
  async handle(event: SmsNotificationEvent): Promise<void> {
    const { phoneNumbers, message, context, metadata } = event;

    this.logger.log(`Processing SMS notification: ${context}`);
    this.logger.log(`Recipients: ${phoneNumbers.join(', ')}`);
    this.logger.log(`Message: ${message}`);
    this.logger.log(`Metadata: ${JSON.stringify(metadata)}`);
    this.logger.log(`SMS notification would be sent successfully (mock mode)`);
  }
}
