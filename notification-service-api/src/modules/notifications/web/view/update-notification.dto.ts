import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationStatus } from 'src/common';

export class UpdateNotificationDto {
  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.SENT,
    required: false,
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiProperty({
    example: 'Connection timeout',
    required: false,
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;
}
