// Change an example on what the configus for each channel could be

export interface EmailConfiguration {
  provider: 'sendgrid' | 'mailgun' | 'smtp';
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export interface SmsConfiguration {
  provider: 'twilio' | 'nexmo';
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface PushConfiguration {
  provider: 'fcm' | 'apns';
  serverKey?: string;
  certificatePath?: string;
}

export interface WhatsAppConfiguration {
  provider: 'twilio';
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SlackConfiguration {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export type ChannelConfiguration =
  | EmailConfiguration
  | SmsConfiguration
  | PushConfiguration
  | WhatsAppConfiguration
  | SlackConfiguration;
