import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';

interface PushNotificationEvent {
  deviceTokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class PushNotificationHandler {
  private readonly logger = new Logger(PushNotificationHandler.name);

  @RabbitSubscribe({
    exchange: EventType.push,
    routingKey: EventNames.PUSH_NOTIFICATION,
    queue: 'PushNotificationHandler',
    errorHandler: RMQErrorHandler('PushNotificationHandler'),
  })
  async handle(event: PushNotificationEvent): Promise<void> {
    const { deviceTokens, title, body, data, metadata } = event;

    this.logger.log(`Processing push notification: ${title}`);
    this.logger.log(`Target devices: ${deviceTokens.length}`);
    this.logger.log(`Device tokens: ${deviceTokens.join(', ')}`);
    this.logger.log(`Title: ${title}`);
    this.logger.log(`Body: ${body}`);
    this.logger.log(`Data: ${JSON.stringify(data)}`);
    this.logger.log(`Metadata: ${JSON.stringify(metadata)}`);
    this.logger.log(`Push notification would be sent successfully (mock mode)`);
  }
}
