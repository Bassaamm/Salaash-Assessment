import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';

interface SmsNotificationEvent {
  phoneNumbers: string[];
  message: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class SmsVerificationHandler {
  private readonly logger = new Logger(SmsVerificationHandler.name);

  @RabbitSubscribe({
    exchange: EventType.sms,
    routingKey: EventNames.SMS_VERIFICATION,
    queue: 'SmsVerificationHandler',
    errorHandler: RMQErrorHandler('SmsVerificationHandler'),
  })
  async handle(event: SmsNotificationEvent): Promise<void> {
    const { phoneNumbers, message, metadata } = event;

    this.logger.log(`Processing SMS verification`);
    this.logger.log(`Recipients: ${phoneNumbers.join(', ')}`);
    this.logger.log(`Message: ${message}`);
    this.logger.log(` Metadata: ${JSON.stringify(metadata)}`);
    this.logger.log(` SMS verification would be sent successfully (mock mode)`);
  }
}
