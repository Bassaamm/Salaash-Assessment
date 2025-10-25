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

describe('Notifications E2E', () => {
  let app: INestApplication;
  let notificationRepository: Repository<Notification>;
  let channelRepository: Repository<Channel>;
  let emailChannel: Channel;

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

    // Create test channel
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
  });

  afterEach(async () => {
    await notificationRepository.query('DELETE FROM notifications');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await notificationRepository.query('DELETE FROM notifications');
    await channelRepository.query('DELETE FROM channels');
    await app.close();
  });

  it('should create a notification', async () => {
    const createDto = {
      recipientId: 'customer@example.com',
      channelId: emailChannel.id,
      templateName: 'order_confirmation',
      data: {
        orderId: 'ORD-123',
        customerName: 'John Doe',
      },
      idempotencyKey: 'test-key-1',
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
      retryCount: 0,
    });
    expect(response.body.id).toBeDefined();
  });

  it('should get a notification by ID', async () => {
    const notification = await notificationRepository.save({
      recipientId: 'test@example.com',
      channel: emailChannel,
      templateName: 'test_template',
      data: { message: 'Test' },
      status: NotificationStatus.PENDING,
      idempotencyKey: 'test-key-2',
      retryCount: 0,
    });

    const response = await request(app.getHttpServer())
      .get(`/notifications/${notification.id}`)
      .expect(200);

    expect(response.body.id).toBe(notification.id);
    expect(response.body.recipientId).toBe(notification.recipientId);
    expect(response.body.status).toBe(NotificationStatus.PENDING);
  });

  it('should list notifications with pagination', async () => {
    await notificationRepository.save([
      {
        recipientId: 'user1@example.com',
        channel: emailChannel,
        templateName: 'template1',
        data: { test: 1 },
        status: NotificationStatus.PENDING,
        idempotencyKey: 'key-1',
        retryCount: 0,
      },
      {
        recipientId: 'user2@example.com',
        channel: emailChannel,
        templateName: 'template2',
        data: { test: 2 },
        status: NotificationStatus.SENT,
        idempotencyKey: 'key-2',
        retryCount: 0,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/notifications')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.currentPage).toBe(1);
  });

  it('should update notification status', async () => {
    const createDto = {
      recipientId: 'update@example.com',
      channelId: emailChannel.id,
      templateName: 'test_template',
      data: { message: 'Update me' },
      idempotencyKey: 'update-key-' + Date.now(),
    };

    const createResponse = await request(app.getHttpServer())
      .post('/notifications')
      .send(createDto)
      .expect(201);

    const notificationId = createResponse.body.id;

    const updateDto = {
      status: NotificationStatus.SENT,
    };

    const response = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}`)
      .send(updateDto)
      .expect(200);

    expect(response.body.status).toBe(NotificationStatus.SENT);
    expect(response.body.id).toBe(notificationId);
  });

  it('should delete a notification', async () => {
    const notification = await notificationRepository.save({
      recipientId: 'delete@example.com',
      channel: emailChannel,
      templateName: 'test_template',
      data: { message: 'Delete me' },
      status: NotificationStatus.SENT,
      idempotencyKey: 'delete-key',
      retryCount: 0,
    });

    await request(app.getHttpServer())
      .delete(`/notifications/${notification.id}`)
      .expect(200);

    const deleted = await notificationRepository.findOne({
      where: { id: notification.id },
    });
    expect(deleted).toBeNull();
  });
});
