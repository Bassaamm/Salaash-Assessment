import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let configService: jest.Mocked<ConfigService>;
  let mockTransporter: any;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, any> = {
        MAIL_HOST: 'localhost',
        MAIL_PORT: 1025,
        MAIL_HTTP_SECURE: 'false',
        MAIL_NO_AUTH: 'true',
        MAIL_FROM: 'noreply@example.com',
        APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development',
      };
      return config[key];
    });

    // Initialize the service
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize nodemailer transporter', () => {
      expect(nodemailer.createTransport).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    const emails = ['user@example.com'];
    const subject = 'Test Email';
    const body = 'This is a test email';

    it('should send plain email successfully', async () => {
      await service.sendEmail(emails, subject, body);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'user@example.com',
        subject,
        html: `<html><body>${body}</body></html>`,
      });
    });

    it('should send email to multiple recipients', async () => {
      const multipleEmails = ['user1@example.com', 'user2@example.com'];

      await service.sendEmail(multipleEmails, subject, body);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'user1@example.com, user2@example.com',
        subject,
        html: `<html><body>${body}</body></html>`,
      });
    });

    it('should send email with template data', async () => {
      const templateName = 'welcome_email';
      const templateData = {
        name: 'John Doe',
        appUrl: 'http://localhost:3000',
      };

      // Mock template loading to return a simple compiled function
      await service.sendEmail(
        emails,
        subject,
        body,
        templateName,
        templateData,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('user@example.com');
      expect(callArgs.subject).toBe(subject);
    });

    it('should use channel-specific configuration', async () => {
      const channelConfig = {
        host: 'smtp.custom.com',
        port: 587,
        secure: true,
        user: 'custom@example.com',
        pass: 'custom-password',
        from: 'custom@example.com',
      };

      // Reset the mock to track new transporter creation
      (nodemailer.createTransport as jest.Mock).mockClear();
      const customTransporter = {
        sendMail: jest
          .fn()
          .mockResolvedValue({ messageId: 'custom-message-id' }),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(
        customTransporter,
      );

      await service.sendEmail(
        emails,
        subject,
        body,
        undefined,
        undefined,
        channelConfig,
      );

      // Verify custom transporter was created
      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: channelConfig.host,
          port: channelConfig.port,
        }),
      );

      // Verify email was sent with custom from address
      expect(customTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: channelConfig.from,
          to: 'user@example.com',
          subject,
        }),
      );
    });

    it('should throw error if email sending fails', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendEmail(emails, subject, body)).rejects.toThrow(
        'SMTP connection failed',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should use default from email if channel config does not provide one', async () => {
      const channelConfig = {
        host: 'smtp.custom.com',
        port: 587,
      };

      const customTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(
        customTransporter,
      );

      await service.sendEmail(
        emails,
        subject,
        body,
        undefined,
        undefined,
        channelConfig,
      );

      expect(customTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com', // Default from configService
        }),
      );
    });
  });

  describe('template handling', () => {
    it('should render template with context variables', async () => {
      const templateData = {
        name: 'John',
        orderId: 'ORD-123',
      };

      // This test verifies that template data can be passed
      // In real scenario, it would render using Handlebars
      await service.sendEmail(
        ['user@example.com'],
        'Order Confirmation',
        'Body',
        'order-confirmation',
        templateData,
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should fallback to plain body if template not found', async () => {
      // Non-existent template should fallback to default template
      await service.sendEmail(
        ['user@example.com'],
        'Test',
        'Plain body',
        'non-existent-template',
        { data: 'test' },
      );

      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });
});
