import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Order } from '../src/modules/orders/core/order.entity';
import { Channel } from '../src/modules/channels/core/channel.entity';
import { Notification } from '../src/modules/notifications/core/notification.entity';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';
import { RMQAdapter } from '../src/rmq/rmq.adapter';

describe('Orders E2E', () => {
  let app: INestApplication;
  let orderRepository: Repository<Order>;
  let channelRepository: Repository<Channel>;
  let notificationRepository: Repository<Notification>;
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

    orderRepository = moduleFixture.get<Repository<Order>>(
      getRepositoryToken(Order),
    );
    channelRepository = moduleFixture.get<Repository<Channel>>(
      getRepositoryToken(Channel),
    );
    notificationRepository = moduleFixture.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );

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
    await orderRepository.query('DELETE FROM orders');
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await notificationRepository.query('DELETE FROM notifications');
    await orderRepository.query('DELETE FROM orders');
    await channelRepository.query('DELETE FROM channels');
    await app.close();
  });

  it('should create an order', async () => {
    const createDto = {
      userId: 'customer@example.com',
      total: 99.99,
      channelIds: [emailChannel.id],
      metadata: {
        items: ['Product A', 'Product B'],
        shippingAddress: '123 Main St',
      },
    };

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(createDto)
      .expect(201);

    expect(response.body).toMatchObject({
      userId: createDto.userId,
      total: createDto.total,
    });
    expect(response.body.id).toBeDefined();
    expect(response.body.orderNumber).toBeDefined();
  });

  it('should get an order by ID', async () => {
    const order = await orderRepository.save({
      userId: 'test@example.com',
      total: 50.0,
      orderNumber: `ORD-${Date.now()}`,
      metadata: { item: 'Test Product' },
    });

    const response = await request(app.getHttpServer())
      .get(`/orders/${order.id}`)
      .expect(200);

    expect(response.body.id).toBe(order.id);
    expect(response.body.userId).toBe(order.userId);
    expect(parseFloat(response.body.total)).toBe(order.total);
  });

  it('should list orders with pagination', async () => {
    await orderRepository.save([
      {
        userId: 'user1@example.com',
        total: 100.0,
        orderNumber: `ORD-${Date.now()}-1`,
        metadata: { item: 'Product 1' },
      },
      {
        userId: 'user2@example.com',
        total: 200.0,
        orderNumber: `ORD-${Date.now()}-2`,
        metadata: { item: 'Product 2' },
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/orders')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toBeDefined();
  });

  it('should update an order', async () => {
    const order = await orderRepository.save({
      userId: 'update@example.com',
      total: 75.0,
      orderNumber: `ORD-${Date.now()}`,
      metadata: { item: 'Original' },
      notes: 'Original notes',
    });

    const updateDto = {
      notes: 'Updated delivery instructions',
    };

    const response = await request(app.getHttpServer())
      .patch(`/orders/${order.id}`)
      .send(updateDto)
      .expect(200);

    expect(response.body.notes).toBe(updateDto.notes);
    expect(response.body.id).toBe(order.id);
  });

  it('should delete an order', async () => {
    const order = await orderRepository.save({
      userId: 'delete@example.com',
      total: 25.0,
      orderNumber: `ORD-${Date.now()}`,
      metadata: { item: 'Delete me' },
    });

    await request(app.getHttpServer())
      .delete(`/orders/${order.id}`)
      .expect(200);

    const deleted = await orderRepository.findOne({
      where: { id: order.id },
    });
    expect(deleted).toBeNull();
  });
});
