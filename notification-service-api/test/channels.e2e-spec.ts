import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Channel } from '../src/modules/channels/core/channel.entity';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';

describe('Channels E2E', () => {
  let app: INestApplication;
  let channelRepository: Repository<Channel>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    channelRepository = moduleFixture.get<Repository<Channel>>(
      getRepositoryToken(Channel),
    );
  });

  afterAll(async () => {
    await channelRepository.query('DELETE FROM notifications');
    await channelRepository.query('DELETE FROM channels');
    await app.close();
  });

  it('should create an email channel', async () => {
    const createDto = {
      name: 'Primary Email Channel',
      type: NotificationChannel.EMAIL,
      configuration: {
        provider: 'smtp',
        fromEmail: 'noreply@example.com',
        fromName: 'Example Corp',
        host: 'smtp.example.com',
        port: 587,
      },
      isActive: true,
    };

    const response = await request(app.getHttpServer())
      .post('/channels')
      .send(createDto)
      .expect(201);

    expect(response.body).toMatchObject({
      name: createDto.name,
      type: createDto.type,
      isActive: true,
    });
    expect(response.body.id).toBeDefined();
    expect(response.body.configuration.provider).toBe('smtp');
  });

  it('should list all channels', async () => {
    const response = await request(app.getHttpServer())
      .get('/channels')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].name).toBeDefined();
    expect(response.body[0].type).toBeDefined();
  });
});
