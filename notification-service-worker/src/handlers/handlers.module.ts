import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../entities/channel.entity';
import { Notification } from '../entities/notification.entity';
import { Template } from '../entities/template.entity';
import { Order } from '../entities/order.entity';

import {
  EmailNotificationHandler,
  EmailOrderConfirmationHandler,
} from './email';

import { SmsNotificationHandler, SmsVerificationHandler } from './sms';

import { PushNotificationHandler, PushOrderUpdateHandler } from './push';

import { EmailService } from '../services/email.service';
import { TemplateService } from '../services/template.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Notification, Template, Order])],
  providers: [
    EmailService,
    TemplateService,

    EmailNotificationHandler,
    EmailOrderConfirmationHandler,

    SmsNotificationHandler,
    SmsVerificationHandler,

    PushNotificationHandler,
    PushOrderUpdateHandler,
  ],
  exports: [
    EmailNotificationHandler,
    EmailOrderConfirmationHandler,

    SmsNotificationHandler,
    SmsVerificationHandler,

    PushNotificationHandler,
    PushOrderUpdateHandler,
  ],
})
export class HandlersModule {}
