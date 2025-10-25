import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsIn,
} from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name (unique per channel)',
    example: 'order_confirmation',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Notification channel',
    enum: ['email', 'sms', 'push'],
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'sms', 'push'])
  channel: string;

  @ApiPropertyOptional({
    description: 'Email subject line with placeholders (e.g., ###orderId###)',
    example: 'Order Confirmation - Order ####orderId###',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description:
      'Full template body (HTML for email, text for SMS/push) with placeholders using ### syntax',
    example:
      '<html><body>Hi ###customerName###, order ###orderId### confirmed!</body></html>',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Required variables for template rendering',
    type: [String],
    example: ['orderId', 'customerName', 'total', 'orderUrl'],
  })
  @IsArray()
  @IsString({ each: true })
  variables: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata (e.g., from_name, reply_to)',
    example: { from_name: 'Order Team', reply_to: 'orders@example.com' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
