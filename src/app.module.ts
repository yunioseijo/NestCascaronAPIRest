import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommonModule } from './common/common.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
// Throttling
// Note: requires installing @nestjs/throttler
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Determine SSL once based on env
const sslEnabled =
  (process.env.DB_SSL ?? (process.env.STAGE === 'prod' ? 'true' : 'false')) ===
  'true';

@Module({
  imports: [
    ConfigModule.forRoot(),

    TypeOrmModule.forRoot({
      // Support DATABASE_URL or discrete vars
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST,
            port: +(process.env.DB_PORT ?? 5432),
            database: process.env.DB_NAME,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
          }),
      // Allow overriding SSL via DB_SSL; default to STAGE === 'prod'
      ssl: sslEnabled,
      extra: {
        ssl: sslEnabled ? { rejectUnauthorized: false } : null,
      },
      autoLoadEntities: true,
      synchronize: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    // Global rate-limiting (install @nestjs/throttler to enable)
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60,
        limit: 60,
      },
      {
        name: 'login',
        ttl: 60,
        limit: 5,
      },
      {
        name: 'refresh',
        ttl: 60,
        limit: 30,
      },
    ]),

    CommonModule,
    AuthModule,

    MessagesWsModule,

    UsersModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Throttler guard (active when dependency is installed)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
