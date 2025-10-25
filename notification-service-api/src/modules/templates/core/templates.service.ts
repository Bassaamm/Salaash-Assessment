import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { Template } from './template.entity';
import { TemplatesRepository } from './templates.repository';
import { CreateTemplateDto } from '../web/view/create-template.dto';
import { UpdateTemplateDto } from '../web/view/update-template.dto';
import { QueryTemplateDto } from '../web/view/query-template.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private readonly templatesRepository: TemplatesRepository,
  ) {}

  async create(dto: CreateTemplateDto): Promise<Template> {
    this.logger.log(`Creating template: ${dto.name} (${dto.channel})`);

    // Check if template already exists
    const existing = await this.templatesRepository.findByNameAndChannel(
      dto.name,
      dto.channel,
    );

    if (existing) {
      throw new ConflictException(
        `Template '${dto.name}' already exists for channel '${dto.channel}'`,
      );
    }

    const template = this.templatesRepository.create(dto);
    const saved = await this.templatesRepository.save(template);

    this.logger.log(`Template created: ${saved.id}`);
    return saved;
  }

  async findAll(query: QueryTemplateDto): Promise<{
    data: Template[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, name, channel, isActive } = query;

    const whereConditions: any = {
      deletedAt: IsNull(),
    };

    if (name) {
      whereConditions.name = name;
    }

    if (channel) {
      whereConditions.channel = channel;
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    const [data, total] = await this.templatesRepository.findAndCount({
      where: whereConditions,
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Template> {
    const template = await this.templatesRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID '${id}' not found`);
    }

    return template;
  }

  async findByNameAndChannel(name: string, channel: string): Promise<Template> {
    const template = await this.templatesRepository.findActiveByNameAndChannel(
      name,
      channel,
    );

    if (!template) {
      throw new NotFoundException(
        `Template '${name}' not found for channel '${channel}'`,
      );
    }

    return template;
  }

  async findByChannel(channel: string): Promise<Template[]> {
    return this.templatesRepository.find({
      where: {
        channel,
        isActive: true,
        deletedAt: IsNull(),
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<Template> {
    this.logger.log(`Updating template: ${id}`);

    const template = await this.findOne(id);

    // If name or channel is being changed, check for conflicts
    if (dto.name || dto.channel) {
      const newName = dto.name || template.name;
      const newChannel = dto.channel || template.channel;

      if (newName !== template.name || newChannel !== template.channel) {
        const existing = await this.templatesRepository.findByNameAndChannel(
          newName,
          newChannel,
        );

        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Template '${newName}' already exists for channel '${newChannel}'`,
          );
        }
      }
    }

    // Increment version on update
    const updatedTemplate = this.templatesRepository.merge(template, {
      ...dto,
      version: template.version + 1,
    });

    const saved = await this.templatesRepository.save(updatedTemplate);

    this.logger.log(`Template updated: ${saved.id} (v${saved.version})`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting template: ${id}`);

    const template = await this.findOne(id);

    await this.templatesRepository.softDelete(template.id);

    this.logger.log(`Template soft deleted: ${id}`);
  }

  async restore(id: string): Promise<Template> {
    this.logger.log(`Restoring template: ${id}`);

    await this.templatesRepository.restore(id);

    const template = await this.templatesRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID '${id}' not found`);
    }

    this.logger.log(`Template restored: ${id}`);
    return template;
  }
}
