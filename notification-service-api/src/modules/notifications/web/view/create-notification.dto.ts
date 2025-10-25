import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsObject,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Recipient identifier (email, phone, device token, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    example: 'uuid-of-channel',
    description: 'Channel ID to use for sending',
  })
  @IsUUID()
  @IsNotEmpty()
  channelId: string;

  @ApiProperty({
    example: 'order_confirmation',
    description: 'Template name to use',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    example: {
      orderId: 'ORD-123',
      customerName: 'John Doe',
      total: 99.99,
    },
    description: 'Template variables data',
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiProperty({
    example: 'order-123-notification',
    description: 'Idempotency key to prevent duplicate notifications',
    required: false,
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
