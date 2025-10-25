import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import { NotificationStatus } from '../../../common/enums/notification-status.enum';
import { Channel } from '../../channels/core/channel.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
@Index(['recipientId'])
@Index(['status'])
@Index(['idempotencyKey'], { unique: true })
@Index(['createdAt'])
export class Notification extends AbstractEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Column({ type: 'varchar', length: 255 })
  recipientId: string;

  @ApiProperty({ example: 'uuid-of-channel' })
  @Column({ type: 'uuid' })
  channelId: string;

  @ManyToOne(() => Channel, { eager: true })
  @JoinColumn({ name: 'channelId' })
  channel: Channel;

  @ApiProperty({ example: 'order_confirmation' })
  @Column({ type: 'varchar', length: 255 })
  templateName: string;

  @ApiProperty({
    example: { orderId: 'ORD-123', customerName: 'John Doe', total: 99.99 },
  })
  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiProperty({ example: 'order-123-notification' })
  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @ApiProperty({ type: Date, nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @ApiProperty({ example: 'Connection timeout', required: false })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;
}
