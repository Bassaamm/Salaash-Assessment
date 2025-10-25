import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from 'src/common/abstract.entity';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum';
import { Notification } from './notification.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('delivery_logs')
@Index(['notificationId'])
export class DeliveryLog extends AbstractEntity {
  @ApiProperty({ example: 'uuid-of-notification' })
  @Column({ type: 'uuid' })
  notificationId: string;

  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int' })
  attemptNumber: number;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.SUCCESS })
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
  })
  status: DeliveryStatus;

  @ApiProperty({
    example: { messageId: 'msg-123', statusCode: 200 },
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  responseData?: Record<string, any>;

  @ApiProperty({ example: 'Connection timeout', required: false })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ type: Date })
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  attemptedAt: Date;
}
