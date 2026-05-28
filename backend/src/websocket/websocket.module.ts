import { Global, Module } from '@nestjs/common';
import { TicketsGateway } from './tickets.gateway';

@Global()
@Module({
  providers: [TicketsGateway],
  exports: [TicketsGateway],
})
export class WebsocketModule {}
