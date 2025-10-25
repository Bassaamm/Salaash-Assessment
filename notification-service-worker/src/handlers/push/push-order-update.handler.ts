import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { RMQErrorHandler } from '../../rmq/rmq-error.handler';
import { EventType, EventNames } from '../../rmq/event-types.enum';

interface PushNotificationEvent {
  deviceTokens: string[];
  title?: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushOrderUpdateHandler {
  private readonly logger = new Logger(PushOrderUpdateHandler.name);

  @RabbitSubscribe({
    exchange: EventType.push,
    routingKey: EventNames.PUSH_ORDER_UPDATE,
    queue: 'PushOrderUpdateHandler',
    errorHandler: RMQErrorHandler('PushOrderUpdateHandler'),
  })
  async handle(event: PushNotificationEvent): Promise<void> {
    const { deviceTokens, title, body, data } = event;

    this.logger.log(`Processing order update push notification`);
    this.logger.log(`Target devices: ${deviceTokens.length}`);
    this.logger.log(`Device tokens: ${deviceTokens.join(', ')}`);
    this.logger.log(`Title: ${title || 'Order Update'}`);
    this.logger.log(`Body: ${body}`);
    this.logger.log(`Data: ${JSON.stringify(data)}`);
    this.logger.log(
      `Order update push notification would be sent successfully (mock mode)`,
    );
  }
}
