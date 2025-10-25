import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Customer identifier (email or phone)',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 99.99,
    description: 'Order total amount',
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description:
      'Channel IDs to send notifications through. If empty or not provided, uses all active channels.',
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  channelIds?: string[];

  @ApiProperty({
    example: {
      items: ['Product A', 'Product B'],
      shippingAddress: '123 Main St',
    },
    description: 'Additional order metadata',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    example: 'Please deliver after 5 PM',
    description: 'Customer notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
