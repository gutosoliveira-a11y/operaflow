import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SectorsModule } from './sectors/sectors.module';
import { WebsocketModule } from './websocket/websocket.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    SectorsModule,
    TicketsModule,
  ],
})
export class AppModule {}
