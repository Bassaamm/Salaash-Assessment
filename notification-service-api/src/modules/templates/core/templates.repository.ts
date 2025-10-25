import { Injectable } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { Template } from './template.entity';

@Injectable()
export class TemplatesRepository extends Repository<Template> {
  async findByNameAndChannel(
    name: string,
    channel: string,
  ): Promise<Template | null> {
    return this.findOne({
      where: {
        name,
        channel,
        deletedAt: IsNull(),
      },
    });
  }

  async findActiveByNameAndChannel(
    name: string,
    channel: string,
  ): Promise<Template | null> {
    return this.findOne({
      where: {
        name,
        channel,
        isActive: true,
        deletedAt: IsNull(),
      },
    });
  }

  async findAllActive(): Promise<Template[]> {
    return this.find({
      where: {
        isActive: true,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
