import { Entity, Column, Index } from 'typeorm';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { AbstractEntity } from 'src/common/abstract.entity';

@Entity('orders')
@Index(['userId'])
@Index(['status'])
export class Order extends AbstractEntity {
  @ApiProperty({ example: 'customer@example.com' })
  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @ApiProperty({ example: 'ORD-12345' })
  @Column({ type: 'varchar', length: 100, unique: true })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({ example: 99.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({
    example: {
      items: ['Product A', 'Product B'],
      shippingAddress: '123 Main St',
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ example: 'Customer notes here', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
