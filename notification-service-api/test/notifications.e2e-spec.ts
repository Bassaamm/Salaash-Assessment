import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Notification } from '../src/modules/notifications/core/notification.entity';
import { Channel } from '../src/modules/channels/core/channel.entity';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';
import { NotificationStatus } from '../src/common/enums/notification-status.enum';
import { RMQAdapter } from '../src/rmq/rmq.adapter';

describe('Notifications Module (e2e)', () => {
  let app: INestApplication;
  let notificationRepository: Repository<Notification>;
  let channelRepository: Repository<Channel>;
  let rmqAdapter: RMQAdapter;

  // Test channels to use across tests
  let emailChannel: Channel;
  let smsChannel: Channel;
  let pushChannel: Channel;

  // Mock RMQ adapter
  const mockRMQAdapter = {
    publish: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RMQAdapter)
      .useValue(mockRMQAdapter)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    notificationRepository = moduleFixture.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    channelRepository = moduleFixture.get<Repository<Channel>>(
      getRepositoryToken(Channel),
    );
    rmqAdapter = moduleFixture.get<RMQAdapter>(RMQAdapter);

    // Create test channels
    emailChannel = await channelRepository.save({
      name: 'Test Email Channel',
      type: NotificationChannel.EMAIL,
      configuration: {
        provider: 'smtp',
        fromEmail: 'test@example.com',
        fromName: 'Test',
        host: 'smtp.test.com',
        port: 587,
      },
      isActive: true,
    });

    smsChannel = await channelRepository.save({
      name: 'Test SMS Channel',
      type: NotificationChannel.SMS,
      configuration: {
        provider: 'twilio',
        accountSid: 'AC123',
        authToken: 'token',
        fromNumber: '+1234567890',
      },
      isActive: true,
    });

    pushChannel = await channelRepository.save({
      name: 'Test Push Channel',
      type: NotificationChannel.PUSH,
      configuration: {
        provider: 'fcm',
        serverKey: 'test-key',
      },
      isActive: true,
    });
  });

  afterEach(async () => {
    // Clear notifications after each test
    await notificationRepository.query('DELETE FROM notifications');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up channels
    await notificationRepository.query('DELETE FROM notifications');
    await channelRepository.query('DELETE FROM channels');
    await app.close();
  });

  describe('POST /notifications - Create Notification', () => {
    it('should create a notification for email channel', async () => {
      const createDto = {
        recipientId: 'customer@example.com',
        channelId: emailChannel.id,
        templateName: 'order_confirmation',
        data: {
          orderId: 'ORD-123',
          customerName: 'John Doe',
          total: 99.99,
        },
        idempotencyKey: 'order-123-email',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        recipientId: createDto.recipientId,
        channelId: createDto.channelId,
        templateName: createDto.templateName,
        status: NotificationStatus.PENDING,
        idempotencyKey: createDto.idempotencyKey,
        retryCount: 0,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.data).toEqual(createDto.data);

      // Verify RMQ publish was called for email
      expect(rmqAdapter.publish).toHaveBeenCalledTimes(1);
      const publishCall = (rmqAdapter.publish as jest.Mock).mock.calls[0];
      expect(publishCall[1]).toBe('email');
    });

    it('should create a notification for SMS channel', async () => {
      const createDto = {
        recipientId: '+1234567890',
        channelId: smsChannel.id,
        templateName: 'order_shipped',
        data: {
          orderId: 'ORD-456',
          trackingNumber: 'TRK-789',
        },
        idempotencyKey: 'order-456-sms',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(201);

      expect(response.body.channelId).toBe(smsChannel.id);
      expect(response.body.status).toBe(NotificationStatus.PENDING);

      // Verify RMQ publish was called for SMS
      expect(rmqAdapter.publish).toHaveBeenCalledTimes(1);
      const publishCall = (rmqAdapter.publish as jest.Mock).mock.calls[0];
      expect(publishCall[1]).toBe('sms');
    });

    it('should create a notification for PUSH channel', async () => {
      const createDto = {
        recipientId: 'device-token-xyz',
        channelId: pushChannel.id,
        templateName: 'new_message',
        data: {
          from: 'Support',
          message: 'You have a new message',
        },
        idempotencyKey: 'push-message-1',
      };

      const response = await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(201);

      expect(response.body.channelId).toBe(pushChannel.id);

      // Verify RMQ publish was called for push
      expect(rmqAdapter.publish).toHaveBeenCalledTimes(1);
      const publishCall = (rmqAdapter.publish as jest.Mock).mock.calls[0];
      expect(publishCall[1]).toBe('push');
    });

    it('should reject duplicate idempotency key', async () => {
      const createDto = {
        recipientId: 'customer@example.com',
        channelId: emailChannel.id,
        templateName: 'order_confirmation',
        data: { orderId: 'ORD-999' },
        idempotencyKey: 'duplicate-key',
      };

      // First request should succeed
      await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(201);

      // Second request with same idempotency key should fail
      const response = await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(409);

      expect(response.body.message).toContain('idempotency key');
    });

    it('should reject invalid UUID for channelId', async () => {
      const createDto = {
        recipientId: 'customer@example.com',
        channelId: 'invalid-uuid',
        templateName: 'test_template',
        data: { test: 'data' },
      };

      await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const createDto = {
        recipientId: 'customer@example.com',
        // Missing channelId, templateName, data
      };

      await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(400);
    });

    it('should fail without idempotency key', async () => {
      const createDto = {
        recipientId: 'customer@example.com',
        channelId: emailChannel.id,
        templateName: 'test_notification',
        data: { message: 'Test' },
        // No idempotencyKey provided - database will reject due to NOT NULL constraint
      };

      // This should fail because idempotencyKey is required by the database
      await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(500); // Internal server error due to database constraint
    });
  });

  describe('GET /notifications - List Notifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await notificationRepository.save([
        {
          recipientId: 'user1@example.com',
          channelId: emailChannel.id,
          templateName: 'welcome',
          data: { name: 'User 1' },
          status: NotificationStatus.SENT,
          idempotencyKey: 'welcome-user1',
        },
        {
          recipientId: 'user2@example.com',
          channelId: emailChannel.id,
          templateName: 'order_confirmation',
          data: { orderId: 'ORD-001' },
          status: NotificationStatus.PENDING,
          idempotencyKey: 'order-user2',
        },
        {
          recipientId: '+1234567890',
          channelId: smsChannel.id,
          templateName: 'verification_code',
          data: { code: '123456' },
          status: NotificationStatus.FAILED,
          idempotencyKey: 'verify-user3',
        },
      ]);
    });

    it('should return paginated notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.totalItems).toBe(3);
      expect(response.body.meta.currentPage).toBe(1);
      expect(response.body.meta.itemsPerPage).toBe(10);
      expect(response.body.meta.totalPages).toBe(1);
    });

    it('should filter notifications by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ status: NotificationStatus.SENT })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(NotificationStatus.SENT);
    });

    it('should filter notifications by recipientId', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ recipientId: 'user1@example.com' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].recipientId).toBe('user1@example.com');
    });

    it('should filter notifications by channelId', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ channelId: smsChannel.id })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].channelId).toBe(smsChannel.id);
    });

    it('should filter notifications by templateName', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ templateName: 'order_confirmation' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].templateName).toBe('order_confirmation');
    });

    it('should search notifications by recipientId', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ search: 'user1' })
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].recipientId).toContain('user1');
    });

    it('should support pagination', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/notifications')
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(page1.body.data).toHaveLength(2);
      expect(page1.body.meta.currentPage).toBe(1);

      const page2 = await request(app.getHttpServer())
        .get('/notifications')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(page2.body.data).toHaveLength(1);
      expect(page2.body.meta.currentPage).toBe(2);
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ sortBy: 'recipientId', sortOrder: 'ASC' })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      // Verify sorted order
      const recipients = response.body.data.map((n) => n.recipientId);
      expect(recipients).toEqual([...recipients].sort());
    });

    it('should include channel relation', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(response.body.data[0].channel).toBeDefined();
      expect(response.body.data[0].channel.name).toBeDefined();
      expect(response.body.data[0].channel.type).toBeDefined();
    });
  });

  describe('GET /notifications/:id - Get Single Notification', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = await notificationRepository.save({
        recipientId: 'test@example.com',
        channelId: emailChannel.id,
        templateName: 'test_template',
        data: { message: 'Test notification' },
        status: NotificationStatus.PENDING,
        idempotencyKey: 'test-notification-1',
      });
    });

    it('should return a notification by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/notifications/${testNotification.id}`)
        .expect(200);

      expect(response.body.id).toBe(testNotification.id);
      expect(response.body.recipientId).toBe(testNotification.recipientId);
      expect(response.body.channel).toBeDefined();
      expect(response.body.channel.id).toBe(emailChannel.id);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/notifications/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('PATCH /notifications/:id - Update Notification', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = await notificationRepository.save({
        recipientId: 'test@example.com',
        channelId: emailChannel.id,
        templateName: 'test_template',
        data: { message: 'Test' },
        status: NotificationStatus.PENDING,
        idempotencyKey: 'update-test-1',
        retryCount: 0,
      });
    });

    it('should update notification status', async () => {
      const updateDto = {
        status: NotificationStatus.SENT,
      };

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.SENT);
      expect(response.body.id).toBe(testNotification.id);
    });

    it('should update notification status to SENT', async () => {
      const updateDto = {
        status: NotificationStatus.SENT,
        // sentAt is not in UpdateNotificationDto, so don't send it
      };

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.SENT);
      // sentAt might be set by the service layer
    });

    it('should update error message on failure', async () => {
      const updateDto = {
        status: NotificationStatus.FAILED,
        errorMessage: 'SMTP connection timeout',
        // failedAt is not in UpdateNotificationDto
      };

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.FAILED);
      expect(response.body.errorMessage).toBe(updateDto.errorMessage);
    });

    it('should update status to processing', async () => {
      const updateDto = {
        status: NotificationStatus.PROCESSING,
        // retryCount is not in UpdateNotificationDto
      };

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${testNotification.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe(NotificationStatus.PROCESSING);
    });

    it('should return 404 when updating non-existent notification', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = { status: NotificationStatus.SENT };

      const response = await request(app.getHttpServer())
        .patch(`/notifications/${fakeId}`)
        .send(updateDto)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /notifications/:id - Delete Notification', () => {
    let testNotification: Notification;

    beforeEach(async () => {
      testNotification = await notificationRepository.save({
        recipientId: 'delete@example.com',
        channelId: emailChannel.id,
        templateName: 'test_template',
        data: { message: 'Delete me' },
        status: NotificationStatus.SENT,
        idempotencyKey: 'delete-test-1',
      });
    });

    it('should soft delete a notification', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/notifications/${testNotification.id}`)
        .expect(200);

      expect(response.body.message).toContain('removed');

      // Verify soft delete - should not be found in normal queries
      const deleted = await notificationRepository.findOne({
        where: { id: testNotification.id },
      });
      expect(deleted).toBeNull();

      // Verify it exists with withDeleted flag
      const count = await notificationRepository.count({
        where: { id: testNotification.id },
        withDeleted: true,
      });
      expect(count).toBe(1);
    });

    it('should return 404 when deleting non-existent notification', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/notifications/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full notification lifecycle', async () => {
      // CREATE
      const createDto = {
        recipientId: 'lifecycle@example.com',
        channelId: emailChannel.id,
        templateName: 'lifecycle_test',
        data: { test: 'data' },
        idempotencyKey: 'lifecycle-test-1',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/notifications')
        .send(createDto)
        .expect(201);

      const notificationId = createResponse.body.id;
      expect(createResponse.body.status).toBe(NotificationStatus.PENDING);

      // READ
      const readResponse = await request(app.getHttpServer())
        .get(`/notifications/${notificationId}`)
        .expect(200);

      expect(readResponse.body.id).toBe(notificationId);

      // UPDATE - Mark as sent
      const updateResponse = await request(app.getHttpServer())
        .patch(`/notifications/${notificationId}`)
        .send({ status: NotificationStatus.SENT })
        .expect(200);

      expect(updateResponse.body.status).toBe(NotificationStatus.SENT);

      // LIST - Should appear in list
      const listResponse = await request(app.getHttpServer())
        .get('/notifications')
        .query({ status: NotificationStatus.SENT })
        .expect(200);

      expect(listResponse.body.data.some((n) => n.id === notificationId)).toBe(true);

      // DELETE
      await request(app.getHttpServer())
        .delete(`/notifications/${notificationId}`)
        .expect(200);

      // VERIFY DELETION
      await request(app.getHttpServer())
        .get(`/notifications/${notificationId}`)
        .expect(404);
    });

    it('should handle multiple notifications for same recipient', async () => {
      const recipientId = 'multi-notification@example.com';

      // Create multiple notifications
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/notifications')
          .send({
            recipientId,
            channelId: emailChannel.id,
            templateName: `template_${i}`,
            data: { index: i },
            idempotencyKey: `multi-test-${i}`,
          })
          .expect(201);
      }

      // Retrieve all notifications for recipient
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .query({ recipientId })
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every((n) => n.recipientId === recipientId)).toBe(true);
    });

    it('should handle notifications across different channels', async () => {
      const notifications = [
        {
          recipientId: 'email@example.com',
          channelId: emailChannel.id,
          templateName: 'email_test',
          data: { type: 'email' },
          idempotencyKey: 'multi-channel-email',
        },
        {
          recipientId: '+1234567890',
          channelId: smsChannel.id,
          templateName: 'sms_test',
          data: { type: 'sms' },
          idempotencyKey: 'multi-channel-sms',
        },
        {
          recipientId: 'device-token',
          channelId: pushChannel.id,
          templateName: 'push_test',
          data: { type: 'push' },
          idempotencyKey: 'multi-channel-push',
        },
      ];

      for (const notification of notifications) {
        await request(app.getHttpServer())
          .post('/notifications')
          .send(notification)
          .expect(201);
      }

      // Verify all channels were used
      const emailNotifs = await request(app.getHttpServer())
        .get('/notifications')
        .query({ channelId: emailChannel.id })
        .expect(200);
      expect(emailNotifs.body.data).toHaveLength(1);

      const smsNotifs = await request(app.getHttpServer())
        .get('/notifications')
        .query({ channelId: smsChannel.id })
        .expect(200);
      expect(smsNotifs.body.data).toHaveLength(1);

      const pushNotifs = await request(app.getHttpServer())
        .get('/notifications')
        .query({ channelId: pushChannel.id })
        .expect(200);
      expect(pushNotifs.body.data).toHaveLength(1);

      // Verify RMQ was called for each channel type
      expect(rmqAdapter.publish).toHaveBeenCalledTimes(3);
    });
  });
});
