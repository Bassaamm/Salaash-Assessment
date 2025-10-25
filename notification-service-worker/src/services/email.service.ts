import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private appUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get('MAIL_HTTP_SECURE') === 'true',
      tls:
        this.configService.get('MAIL_TLS') === 'true'
          ? { rejectUnauthorized: false }
          : undefined,
      auth:
        this.configService.get('MAIL_NO_AUTH') === 'true'
          ? undefined
          : {
              user: this.configService.get('MAIL_USER') ?? '',
              pass: this.configService.get('MAIL_PASS') ?? '',
            },
    });

    this.appUrl = this.configService.get('APP_URL') || 'localhost:3000';
    this.logger.log('Email service initialized');
  }

  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      __dirname,
      '../../templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      this.logger.warn(`Template not found: ${templatePath}, using default`);
      return Handlebars.compile('<h1>{{subject}}</h1><p>{{body}}</p>');
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(templateContent);
    this.templateCache.set(templateName, compiled);

    return compiled;
  }

  private renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const template = this.loadTemplate(templateName);
    return template({
      ...context,
      currentYear: new Date().getFullYear(),
      appUrl: this.appUrl,
    });
  }

  private createTransporter(channelConfig?: Record<string, any>): Transporter {
    if (channelConfig) {
      this.logger.log(
        `Using channel-specific configuration: ${channelConfig.host || 'default'}`,
      );
      return nodemailer.createTransport({
        host: channelConfig.host || this.configService.get('MAIL_HOST'),
        port: channelConfig.port || this.configService.get<number>('MAIL_PORT'),
        secure:
          channelConfig.secure ||
          this.configService.get('MAIL_HTTP_SECURE') === 'true',
        tls: channelConfig.tls
          ? { rejectUnauthorized: false }
          : this.configService.get('MAIL_TLS') === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
        auth:
          channelConfig.auth ||
          (this.configService.get('MAIL_NO_AUTH') === 'true'
            ? undefined
            : {
                user:
                  channelConfig.user ||
                  this.configService.get('MAIL_USER') ||
                  '',
                pass:
                  channelConfig.pass ||
                  this.configService.get('MAIL_PASS') ||
                  '',
              }),
      });
    }
    return this.transporter;
  }

  async sendEmail(
    emails: string[],
    subject: string,
    body: string,
    templateName?: string,
    templateData?: Record<string, any>,
    channelConfig?: Record<string, any>,
  ): Promise<void> {
    try {
      let html: string;

      if (templateName && templateData) {
        // Use template
        html = this.renderTemplate(templateName, templateData);
      } else {
        // Use plain body
        html = `<html><body>${body}</body></html>`;
      }

      // Use channel config if provided, otherwise use default
      const transporter = this.createTransporter(channelConfig);
      const fromEmail =
        channelConfig?.from ||
        this.configService.get('MAIL_FROM') ||
        'noreply@example.com';

      const mailOptions = {
        from: fromEmail,
        to: emails.join(', '),
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${emails.join(', ')} from ${fromEmail}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }
}
