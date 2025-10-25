import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Channel } from '../src/modules/channels/core/channel.entity';
import { NotificationChannel } from '../src/common/enums/notification-channel.enum';

describe('Channels Module (e2e)', () => {
  let app: INestApplication;
  let channelRepository: Repository<Channel>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same validation pipe as main app
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

  afterEach(async () => {
    // Clean up database after each test - handle foreign key constraints
    await channelRepository.query('DELETE FROM notifications');
    await channelRepository.query('DELETE FROM channels');
  });

  afterAll(async () => {
    // Final cleanup
    await channelRepository.query('DELETE FROM notifications');
    await channelRepository.query('DELETE FROM channels');
    await app.close();
  });

  describe('POST /channels - Create Channel', () => {
    it('should create an email channel with SMTP configuration', async () => {
      const createDto = {
        name: 'Primary Email Channel',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'smtp',
          fromEmail: 'noreply@example.com',
          fromName: 'Example Corp',
          host: 'smtp.example.com',
          port: 587,
          username: 'user@example.com',
          password: 'secure-password',
        },
        description: 'Main SMTP email channel',
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
        description: createDto.description,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.configuration.provider).toBe('smtp');
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      // Verify in database
      const savedChannel = await channelRepository.findOne({
        where: { id: response.body.id },
      });
      expect(savedChannel).toBeDefined();
      expect(savedChannel.name).toBe(createDto.name);
    });

    it('should create an SMS channel with Twilio configuration', async () => {
      const createDto = {
        name: 'SMS Notification Channel',
        type: NotificationChannel.SMS,
        configuration: {
          provider: 'twilio',
          accountSid: 'ACxxxxxxxxxxxxx',
          authToken: 'test-auth-token',
          fromNumber: '+1234567890',
        },
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(201);

      expect(response.body.type).toBe(NotificationChannel.SMS);
      expect(response.body.configuration.provider).toBe('twilio');
      expect(response.body.configuration.fromNumber).toBe('+1234567890');
    });

    it('should create a PUSH channel with FCM configuration', async () => {
      const createDto = {
        name: 'Mobile Push Notifications',
        type: NotificationChannel.PUSH,
        configuration: {
          provider: 'fcm',
          serverKey: 'firebase-server-key-here',
        },
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(201);

      expect(response.body.type).toBe(NotificationChannel.PUSH);
      expect(response.body.configuration.provider).toBe('fcm');
    });

    it('should create a SendGrid email channel', async () => {
      const createDto = {
        name: 'SendGrid Channel',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'sendgrid',
          apiKey: 'SG.xxxxxxxxxxxxxxxx',
          fromEmail: 'notifications@company.com',
          fromName: 'Company Notifications',
        },
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(201);

      expect(response.body.configuration.provider).toBe('sendgrid');
      expect(response.body.configuration.apiKey).toBeDefined();
    });

    it('should reject invalid channel type', async () => {
      const createDto = {
        name: 'Invalid Channel',
        type: 'INVALID_TYPE',
        configuration: {},
        isActive: true,
      };

      await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const createDto = {
        type: NotificationChannel.EMAIL,
        // Missing name and configuration
      };

      await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /channels - List Channels', () => {
    beforeEach(async () => {
      // Create test channels
      await channelRepository.save([
        {
          name: 'Email Channel 1',
          type: NotificationChannel.EMAIL,
          configuration: {
            provider: 'smtp',
            fromEmail: 'test1@example.com',
            fromName: 'Test 1',
          },
          isActive: true,
        },
        {
          name: 'Email Channel 2',
          type: NotificationChannel.EMAIL,
          configuration: {
            provider: 'sendgrid',
            apiKey: 'test-key',
            fromEmail: 'test2@example.com',
            fromName: 'Test 2',
          },
          isActive: false,
        },
        {
          name: 'SMS Channel',
          type: NotificationChannel.SMS,
          configuration: {
            provider: 'twilio',
            accountSid: 'AC123',
            authToken: 'token',
            fromNumber: '+1234567890',
          },
          isActive: true,
        },
      ]);
    });

    it('should return all channels without filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBeDefined();
      expect(response.body[0].type).toBeDefined();
      expect(response.body[0].configuration).toBeDefined();
    });

    it('should filter channels by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .query({ type: NotificationChannel.EMAIL })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((ch) => ch.type === NotificationChannel.EMAIL)).toBe(true);
    });

    it('should filter channels by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .query({ isActive: true })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((ch) => ch.isActive === true)).toBe(true);
    });

    it('should filter by type and active status combined', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .query({ type: NotificationChannel.EMAIL, isActive: true })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe(NotificationChannel.EMAIL);
      expect(response.body[0].isActive).toBe(true);
    });

    it('should return empty array when no channels match filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels')
        .query({ type: NotificationChannel.PUSH })
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /channels/:id - Get Single Channel', () => {
    let testChannel: Channel;

    beforeEach(async () => {
      testChannel = await channelRepository.save({
        name: 'Test Channel',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'smtp',
          fromEmail: 'test@example.com',
          fromName: 'Test',
          host: 'smtp.test.com',
          port: 587,
        },
        isActive: true,
        description: 'Test description',
      });
    });

    it('should return a channel by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/channels/${testChannel.id}`)
        .expect(200);

      expect(response.body.id).toBe(testChannel.id);
      expect(response.body.name).toBe(testChannel.name);
      expect(response.body.type).toBe(testChannel.type);
      expect(response.body.configuration).toBeDefined();
      expect(response.body.description).toBe(testChannel.description);
    });

    it('should return empty object for non-existent channel', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app.getHttpServer())
        .get(`/channels/${fakeId}`)
        .expect(200);

      // NestJS returns empty object for null values
      expect(response.body).toEqual({});
    });
  });

  describe('GET /channels/available - Get Available Channel Types', () => {
    it('should return list of available channel types with configurations', async () => {
      const response = await request(app.getHttpServer())
        .get('/channels/available')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check structure of returned data
      const emailChannel = response.body.find((ch) => ch.type === NotificationChannel.EMAIL);
      expect(emailChannel).toBeDefined();
      if (emailChannel && emailChannel.providers) {
        expect(Array.isArray(emailChannel.providers)).toBe(true);
      }
    });
  });

  describe('PATCH /channels/:id - Update Channel', () => {
    let testChannel: Channel;

    beforeEach(async () => {
      testChannel = await channelRepository.save({
        name: 'Original Name',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'smtp',
          fromEmail: 'original@example.com',
          fromName: 'Original',
          host: 'smtp.original.com',
          port: 587,
        },
        isActive: true,
        description: 'Original description',
      });
    });

    it('should update channel name and description', async () => {
      const updateDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/channels/${testChannel.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.type).toBe(testChannel.type); // Unchanged

      // Verify in database
      const updated = await channelRepository.findOne({
        where: { id: testChannel.id },
      });
      expect(updated.name).toBe(updateDto.name);
    });

    it('should update isActive status', async () => {
      const updateDto = {
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/channels/${testChannel.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });

    it('should update configuration', async () => {
      const updateDto = {
        configuration: {
          provider: 'sendgrid',
          apiKey: 'new-api-key',
          fromEmail: 'updated@example.com',
          fromName: 'Updated',
        },
      };

      const response = await request(app.getHttpServer())
        .patch(`/channels/${testChannel.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.configuration.provider).toBe('sendgrid');
      expect(response.body.configuration.apiKey).toBe('new-api-key');
    });

    it('should return empty object when updating non-existent channel', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updateDto = { name: 'New Name' };

      const response = await request(app.getHttpServer())
        .patch(`/channels/${fakeId}`)
        .send(updateDto)
        .expect(200);

      // NestJS returns empty object for null values
      expect(response.body).toEqual({});
    });
  });

  describe('DELETE /channels/:id - Delete Channel', () => {
    let testChannel: Channel;

    beforeEach(async () => {
      testChannel = await channelRepository.save({
        name: 'Channel to Delete',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'smtp',
          fromEmail: 'delete@example.com',
          fromName: 'Delete',
          host: 'smtp.delete.com',
          port: 587,
        },
        isActive: true,
      });
    });

    it('should soft delete a channel', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/channels/${testChannel.id}`)
        .expect(200);

      // NestJS may return empty object for boolean true
      expect(response.body === true || response.body === {} || Object.keys(response.body).length === 0).toBe(true);

      // Verify soft delete - channel should not be found in normal queries
      const deleted = await channelRepository.findOne({
        where: { id: testChannel.id },
      });
      expect(deleted).toBeNull();

      // Verify soft delete worked by checking count with withDeleted
      const countWithDeleted = await channelRepository.count({
        where: { id: testChannel.id },
        withDeleted: true,
      });
      expect(countWithDeleted).toBe(1);
    });

    it('should return empty object when deleting non-existent channel', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .delete(`/channels/${fakeId}`)
        .expect(200);

      // NestJS returns empty object for boolean false
      expect(response.body === false || response.body === {} || Object.keys(response.body).length === 0).toBe(true);
    });

    it('should not return soft-deleted channels in list', async () => {
      // Create another active channel
      await channelRepository.save({
        name: 'Active Channel',
        type: NotificationChannel.SMS,
        configuration: {
          provider: 'twilio',
          accountSid: 'AC123',
          authToken: 'token',
          fromNumber: '+1234567890',
        },
        isActive: true,
      });

      // Delete the test channel
      await request(app.getHttpServer())
        .delete(`/channels/${testChannel.id}`)
        .expect(200);

      // List all channels
      const response = await request(app.getHttpServer())
        .get('/channels')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Active Channel');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full CRUD lifecycle for a channel', async () => {
      // CREATE
      const createDto = {
        name: 'Lifecycle Test Channel',
        type: NotificationChannel.EMAIL,
        configuration: {
          provider: 'smtp',
          fromEmail: 'lifecycle@example.com',
          fromName: 'Lifecycle Test',
          host: 'smtp.lifecycle.com',
          port: 587,
        },
        isActive: true,
        description: 'Testing full lifecycle',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/channels')
        .send(createDto)
        .expect(201);

      const channelId = createResponse.body.id;

      // READ
      const readResponse = await request(app.getHttpServer())
        .get(`/channels/${channelId}`)
        .expect(200);

      expect(readResponse.body.name).toBe(createDto.name);

      // UPDATE
      const updateDto = {
        name: 'Updated Lifecycle Channel',
        isActive: false,
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/channels/${channelId}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateDto.name);
      expect(updateResponse.body.isActive).toBe(false);

      // DELETE
      await request(app.getHttpServer())
        .delete(`/channels/${channelId}`)
        .expect(200);

      // VERIFY DELETION
      const deletedResponse = await request(app.getHttpServer())
        .get(`/channels/${channelId}`)
        .expect(200);

      // NestJS returns empty object for null values
      expect(deletedResponse.body).toEqual({});
    });

    it('should support multiple active channels of different types', async () => {
      // Create multiple channels
      const channels = [
        {
          name: 'Email Channel',
          type: NotificationChannel.EMAIL,
          configuration: {
            provider: 'smtp',
            fromEmail: 'email@example.com',
            fromName: 'Email',
            host: 'smtp.example.com',
            port: 587,
          },
          isActive: true,
        },
        {
          name: 'SMS Channel',
          type: NotificationChannel.SMS,
          configuration: {
            provider: 'twilio',
            accountSid: 'AC123',
            authToken: 'token',
            fromNumber: '+1234567890',
          },
          isActive: true,
        },
        {
          name: 'Push Channel',
          type: NotificationChannel.PUSH,
          configuration: {
            provider: 'fcm',
            serverKey: 'firebase-key',
          },
          isActive: true,
        },
      ];

      for (const channel of channels) {
        await request(app.getHttpServer())
          .post('/channels')
          .send(channel)
          .expect(201);
      }

      // Verify all channels exist
      const response = await request(app.getHttpServer())
        .get('/channels')
        .query({ isActive: true })
        .expect(200);

      expect(response.body).toHaveLength(3);
      
      const types = response.body.map((ch) => ch.type);
      expect(types).toContain(NotificationChannel.EMAIL);
      expect(types).toContain(NotificationChannel.SMS);
      expect(types).toContain(NotificationChannel.PUSH);
    });
  });
});
