import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsObject,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import type { ChannelConfiguration } from 'src/common';
import { NotificationChannel } from 'src/common';

export class CreateChannelDto {
  @ApiProperty({ example: 'Primary Email', description: 'Channel name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    description: 'Channel type',
  })
  @IsEnum(NotificationChannel)
  type: NotificationChannel;

  @ApiProperty({
    example: {
      provider: 'sendgrid',
      apiKey: 'SG.xxx',
      fromEmail: 'noreply@company.com',
      fromName: 'Company Name',
    },
    description: 'Channel configuration (credentials and settings)',
  })
  @IsObject()
  @IsNotEmpty()
  configuration: ChannelConfiguration;

  @ApiProperty({
    example: 'SendGrid email service for transactional emails',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
