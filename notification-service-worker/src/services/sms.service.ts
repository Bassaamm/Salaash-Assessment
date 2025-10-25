import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('SMS service initialized');
    // Initialize SMS provider (Twilio, AWS SNS, Nexmo, etc.)
  }

  async sendSms(
    phoneNumbers: string[],
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      this.logger.log(`Sending SMS to ${phoneNumbers.join(', ')}`);

      // Examples:
      // - Twilio: await this.twilioClient.messages.create({ ... })
      // - AWS SNS: await this.sns.publish({ ... })

      console.log('=== SENDING SMS ===');
      console.log('To:', phoneNumbers);
      console.log('Message:', message);
      console.log('Metadata:', metadata);
      console.log('===================');

      this.logger.log(`SMS sent successfully to ${phoneNumbers.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw error;
    }
  }
}
