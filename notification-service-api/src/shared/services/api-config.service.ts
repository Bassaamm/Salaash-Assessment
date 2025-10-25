import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { sync } from 'glob';
import { RedisOptions } from 'ioredis';
import { resolve } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerOptions } from '@nestjs-modules/mailer';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  private get(key: string): string {
    return this.configService.get(key)!;
  }

  private getBoolean(key: string): boolean {
    return this.get(key) === 'true';
  }

  private getInt(key: string): number {
    return parseInt(this.get(key), 10);
  }

  get dbConfig(): TypeOrmModuleOptions {
    const migrations = [__dirname + '/../../database/migrations/*{.ts,.js}']
      .map((pattern) => sync(resolve(pattern).replace(/\\/g, '/')))
      .reduce((acc, filePath) => acc.concat(filePath), []);

    return {
      type: 'postgres',
      host: this.get('DB_HOST'),
      port: parseInt(this.get('DB_PORT'), 10),
      username: this.get('DB_USERNAME'),
      password: this.get('DB_PASSWORD'),
      database: this.get('DB_NAME'),
      ssl: this.getBoolean('DB_SSL') ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      migrationsRun: true,
      migrations: migrations,
      synchronize: false,
      logging: false,
    } as TypeOrmModuleOptions;
  }

  get redisConfig(): RedisOptions {
    return {
      host: this.get('REDIS_HOST'),
      port: this.getInt('REDIS_PORT'),
      password: this.get('REDIS_PASSWORD') || undefined,
      username: this.get('REDIS_USERNAME') || undefined,
      tls: this.getBoolean('REDIS_TLS') ? { rejectUnauthorized: false } : null,
    } as RedisOptions;
  }

  get appConfig() {
    return {
      appUrl: this.get('APP_URL'),
      appHttpSecure: this.get('APP_HTTP_SECURE') === 'true',
    };
  }

  get mailConfig(): MailerOptions {
    return {
      transport: {
        host: this.get('MAIL_HOST'),
        port: this.getInt('MAIL_PORT'),
        secure: this.getBoolean('MAIL_HTTP_SECURE'),
        tls: this.getBoolean('MAIL_TLS')
          ? { rejectUnauthorized: false }
          : undefined,
        auth: this.getBoolean('MAIL_NO_AUTH')
          ? undefined
          : {
              user: this.get('MAIL_USER') ?? '',
              pass: this.get('MAIL_PASS') ?? '',
            },
      },
      defaults: {
        from: this.get('MAIL_FROM'),
      },
      template: {
        dir: __dirname + '/../templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
