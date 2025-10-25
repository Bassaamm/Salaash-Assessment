import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationStatus } from 'src/common';

export class QueryNotificationDto {
  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Search by recipient ID (partial match)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    description: 'Filter by status',
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Filter by exact recipient ID',
  })
  @IsString()
  @IsOptional()
  recipientId?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-channel',
    description: 'Filter by channel ID',
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiPropertyOptional({
    example: 'order_confirmation',
    description: 'Filter by template name',
  })
  @IsString()
  @IsOptional()
  templateName?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts at 1)',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'sentAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
