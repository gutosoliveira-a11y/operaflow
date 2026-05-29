import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SectorsModule } from './sectors/sectors.module';
import { WebsocketModule } from './websocket/websocket.module';
import { TicketsModule } from './tickets/tickets.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { AIModule } from './ai/ai.module';
import { SlaModule } from './sla/sla.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          connection: redisUrl
            ? { url: redisUrl, skipVersionCheck: true }
            : {
                host: config.get<string>('REDIS_HOST', '127.0.0.1'),
                port: config.get<number>('REDIS_PORT', 6379),
                skipVersionCheck: true,
              },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    SectorsModule,
    TicketsModule,
    DashboardModule,
    WhatsAppModule,
    AIModule,
    SlaModule,
    NotificationsModule,
  ],
})
export class AppModule {}
