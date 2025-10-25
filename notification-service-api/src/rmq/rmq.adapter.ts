import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { EventType } from './event-types.enum';

@Injectable()
export class RMQAdapter {
  private readonly logger = new Logger(RMQAdapter.name);

  constructor(private amqpConnection: AmqpConnection) {}

  /**
   * Publish event to RabbitMQ
   * @param eventData - Plain object with event data
   * @param exchange - Exchange name ('email', 'sms', 'push', 'whatsapp', 'slack')
   * @param routingKey - Event name for routing (e.g., 'EmailNotificationEvent')
   */
  async publish(
    eventData: any,
    exchange: EventType,
    routingKey: string,
  ): Promise<void> {
    try {
      this.logger.log(`Publishing: ${routingKey} to ${exchange}`);
      await this.amqpConnection.publish(exchange, routingKey, eventData, {});
      this.logger.log(`Published successfully: ${routingKey}`);
    } catch (error) {
      this.logger.error(`Failed to publish ${routingKey}`);
      throw error;
    }
  }

  // Publish multiple events
  async publishAll(
    events: Array<{ data: any; exchange: EventType; routingKey: string }>,
  ): Promise<void> {
    await Promise.all(
      events.map((e) => this.publish(e.data, e.exchange, e.routingKey)),
    );
  }
}
