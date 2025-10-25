export enum EventType {
  email = 'email',
  sms = 'sms',
  push = 'push',
  notification = 'notification',
}

// Event names as constants for routing keys
export const EventNames = {
  // Email events
  EMAIL_NOTIFICATION: 'EmailNotificationEvent',
  EMAIL_ORDER_CONFIRMATION: 'EmailOrderConfirmationEvent',
  EMAIL_WELCOME: 'EmailWelcomeEvent',
  EMAIL_PASSWORD_RESET: 'EmailPasswordResetEvent',

  // SMS events
  SMS_NOTIFICATION: 'SmsNotificationEvent',
  SMS_VERIFICATION: 'SmsVerificationEvent',

  // Push notification events
  PUSH_NOTIFICATION: 'PushNotificationEvent',

  // Generic notification events
  NOTIFICATION_CREATED: 'NotificationCreatedEvent',
};
