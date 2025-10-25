import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Template } from '../entities/template.entity';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(Template)
    private templateRepo: Repository<Template>,
  ) {}

  async getTemplateConfig(name: string, channel: string): Promise<Template> {
    const template = await this.templateRepo.findOne({
      where: { name, channel, isActive: true, deletedAt: IsNull() },
    });

    if (!template) {
      throw new NotFoundException(
        `Template '${name}' not found for channel '${channel}'`,
      );
    }

    return template;
  }

  async renderEmail(
    templateName: string,
    data: Record<string, any>,
  ): Promise<{ subject: string; html: string }> {
    this.logger.log(`Rendering email template: ${templateName}`);

    const template = await this.getTemplateConfig(templateName, 'email');

    // Validate required variables
    this.validateVariables(template.variables, data);

    // Replace placeholders in subject and body
    const subject = this.replacePlaceholders(template.subject || '', data);
    const html = this.replacePlaceholders(template.body, data);

    this.logger.log(`Email template rendered successfully: ${templateName}`);

    return { subject, html };
  }

  async renderSMS(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string> {
    this.logger.log(`Rendering SMS template: ${templateName}`);

    const template = await this.getTemplateConfig(templateName, 'sms');
    this.validateVariables(template.variables, data);

    const rendered = this.replacePlaceholders(template.body, data);

    this.logger.log(`SMS template rendered successfully: ${templateName}`);
    return rendered;
  }

  async renderPush(
    templateName: string,
    data: Record<string, any>,
  ): Promise<{ title: string; body: string }> {
    this.logger.log(`Rendering push template: ${templateName}`);

    const template = await this.getTemplateConfig(templateName, 'push');
    this.validateVariables(template.variables, data);

    // For push, we expect title in subject field
    const title = this.replacePlaceholders(template.subject || '', data);
    const body = this.replacePlaceholders(template.body, data);

    this.logger.log(`Push template rendered successfully: ${templateName}`);
    return { title, body };
  }

  private replacePlaceholders(
    template: string,
    data: Record<string, any>,
  ): string {
    if (!template) return '';

    let result = template;

    Object.keys(data).forEach((key) => {
      const placeholder = `###${key}###`;
      const value =
        data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
      result = result.split(placeholder).join(value);
    });

    return result;
  }

  private validateVariables(required: string[], provided: Record<string, any>) {
    const missing = required.filter((key) => !(key in provided));

    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }
  }
}
