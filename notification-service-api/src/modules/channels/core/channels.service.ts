import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChannelDto } from '../web/view/create-channel.dto';
import { UpdateChannelDto } from '../web/view/update-channel.dto';
import { QueryChannelDto } from '../web/view/query-channel.dto';
import { AbstractService } from 'src/common';
import { Channel } from './channel.entity';

@Injectable()
export class ChannelsService extends AbstractService<Channel> {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {
    super();
    this.repository = channelRepository;
  }

  async create(createChannelDto: CreateChannelDto): Promise<Channel> {
    const channel = this.channelRepository.create(createChannelDto);
    return this.save(channel);
  }

  async findAllWithFilters(query: QueryChannelDto): Promise<Channel[]> {
    const queryBuilder = this.channelRepository.createQueryBuilder('channel');

    // Apply filters
    if (query.type) {
      queryBuilder.andWhere('channel.type = :type', { type: query.type });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('channel.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    // Default sorting
    queryBuilder.orderBy('channel.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async updateChannel(
    id: string,
    updateChannelDto: UpdateChannelDto,
  ): Promise<Channel | null> {
    return this.update(id, updateChannelDto);
  }

  async removeChannel(id: string): Promise<boolean> {
    return this.remove(id);
  }
}
