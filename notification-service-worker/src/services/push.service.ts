import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly fcmServerKey: string;
  private readonly oneSignalAppId: string;
  private readonly oneSignalApiKey: string;

  constructor(private readonly configService: ConfigService) {
    // the keys are not used in this mock implementation or even defined but just for the sake of the example
    this.oneSignalAppId =
      this.configService.get<string>('ONESIGNAL_APP_ID') || '';
    this.oneSignalApiKey =
      this.configService.get<string>('ONESIGNAL_API_KEY') || '';

    this.logger.log('Push notification service initialized');
  }

  /**
   * Send push notification
   * mock implementation
   */
  async sendPushNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending push notification to ${deviceTokens.length} devices`,
      );

      // Mock implementation - log the notification
      console.log('=== SENDING PUSH NOTIFICATION ===');
      console.log('Device Tokens:', deviceTokens);
      console.log('Title:', title);
      console.log('Body:', body);
      console.log('Data:', data);
      console.log('==================================');

      this.logger.log(
        `Push notification sent successfully to ${deviceTokens.length} devices`,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to send push notification: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
  // for in app notifications we can use onesingal
  async sendViaOneSignal(
    playerIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (!this.oneSignalAppId || !this.oneSignalApiKey) {
      this.logger.warn('OneSignal credentials not configured');
      return;
    }

    this.logger.log('OneSignal push notification would be sent here');
  }
}
