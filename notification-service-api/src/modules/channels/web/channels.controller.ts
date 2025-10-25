import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelsService } from '../core/channels.service';
import { CreateChannelDto } from './view/create-channel.dto';
import { UpdateChannelDto } from './view/update-channel.dto';
import { QueryChannelDto } from './view/query-channel.dto';
import availableChannels from 'src/common/data/availableChannels';

@ApiTags('channels')
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid channel configuration' })
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all channels with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns all channels' })
  getAllChannels(@Query() query: QueryChannelDto) {
    return this.channelsService.findAllWithFilters(query);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available channel types' })
  @ApiResponse({ status: 200, description: 'Returns available channel types' })
  getAvailableChannels() {
    return availableChannels;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a channel by ID' })
  @ApiResponse({ status: 200, description: 'Returns the channel' })
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a channel' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.updateChannel(id, updateChannelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a channel (soft delete)' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  remove(@Param('id') id: string) {
    return this.channelsService.removeChannel(id);
  }
}
