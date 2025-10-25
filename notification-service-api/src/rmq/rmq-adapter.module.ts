import { Global, Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RMQAdapter } from './rmq.adapter';
import { EventType } from './event-types.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          { name: EventType.email, type: 'direct', options: {} },
          { name: EventType.sms, type: 'direct', options: {} },
          { name: EventType.push, type: 'direct', options: {} },
          { name: EventType.notification, type: 'direct', options: {} },
        ],
        uri:
          configService.get<string>('RABBITMQ_URI') || 'amqp://localhost:5672',
        prefetchCount: 3,
        connectionManagerOptions: { heartbeatIntervalInSeconds: 30 },
        connectionInitOptions: { wait: true, timeout: 10000 },
      }),
    }),
  ],
  providers: [RMQAdapter],
  exports: [RMQAdapter],
})
export class RMQAdapterModule {}
