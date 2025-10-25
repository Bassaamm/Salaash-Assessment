// IMPORTANT: Keep this in sync with backend!
export enum EventType {
  email = 'email',
  sms = 'sms',
  push = 'push',
  notification = 'notification',
}

// Event names - must match backend exactly
export const EventNames = {
  // Email events
  EMAIL_NOTIFICATION: 'EmailNotificationEvent',
  EMAIL_ORDER_CONFIRMATION: 'EmailOrderConfirmationEvent',

  // SMS events
  SMS_NOTIFICATION: 'SmsNotificationEvent',
  SMS_VERIFICATION: 'SmsVerificationEvent',

  // Push notification events
  PUSH_NOTIFICATION: 'PushNotificationEvent',
  PUSH_ORDER_UPDATE: 'PushOrderUpdateEvent',

  // Generic notification events
  NOTIFICATION_CREATED: 'NotificationCreatedEvent',
};
