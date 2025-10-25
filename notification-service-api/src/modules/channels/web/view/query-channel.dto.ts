import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel } from 'src/common';

export class QueryChannelDto {
  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: 'Filter by channel type',
  })
  @IsEnum(NotificationChannel)
  @IsOptional()
  type?: NotificationChannel;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
