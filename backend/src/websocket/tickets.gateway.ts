import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tickets',
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  emitTicketCreated(ticket: Record<string, unknown>) {
    this.server.emit('ticket:created', ticket);
  }

  emitTicketUpdated(ticket: Record<string, unknown>) {
    this.server.emit('ticket:updated', ticket);
  }

  emitStatusChanged(data: { ticketId: string; oldStatus: string; newStatus: string }) {
    this.server.emit('ticket:status_changed', data);
  }

  emitKanbanUpdate(sectorId?: string) {
    this.server.emit('kanban:update', { sectorId });
  }
}
