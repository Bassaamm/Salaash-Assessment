import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';
import type { ChannelConfiguration } from '../../../common/channel-configuration.interface';
import { ApiProperty } from '@nestjs/swagger';

@Entity('channels')
@Index(['type'])
export class Channel extends AbstractEntity {
  @ApiProperty({ example: 'Primary Email' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  type: NotificationChannel;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    example: {
      provider: 'sendgrid',
      apiKey: 'SG.xxx',
      fromEmail: 'noreply@company.com',
      fromName: 'Company Name',
    },
  })
  @Column({ type: 'jsonb' })
  configuration: ChannelConfiguration;

  @ApiProperty({ example: 'SendGrid email service', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;
}
