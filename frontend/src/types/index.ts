export type Role = 'operador' | 'supervisor' | 'coordenador' | 'gerente' | 'administrador';
export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando' | 'escalado' | 'finalizado' | 'cancelado';
export type Priority = 'baixa' | 'media' | 'alta' | 'critica';
export type MessageSource = 'whatsapp' | 'internal' | 'system';
export type TicketSource = 'manual' | 'whatsapp' | 'email' | 'api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  sectorId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sector {
  id: string;
  name: string;
  slaDefaultHours: number;
  responsible: { id: string; name: string } | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  authorId: string | null;
  source: MessageSource;
  createdAt: string;
  author: { id: string; name: string } | null;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: Priority;
  sectorId: string;
  responsibleId: string | null;
  createdBy: string;
  source: TicketSource;
  slaDueDate: string | null;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  sector: { id: string; name: string; slaDefaultHours: number };
  responsible: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string; email: string };
  messages: TicketMessage[];
}

export interface KanbanColumns {
  aberto: Ticket[];
  em_andamento: Ticket[];
  aguardando: Ticket[];
  escalado: Ticket[];
}

export interface KpiData {
  totalOpen: number;
  totalOverdue: number;
  slaCompliance: number;
  avgResolutionHours: number;
  bySector: { sectorId: string; count: number }[];
  byPriority: { priority: Priority; count: number }[];
  byStatus: { status: TicketStatus; count: number }[];
  recentActivity: {
    id: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
    updatedAt: string;
    sector: { name: string };
  }[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface SlaConfig {
  id: string;
  sectorId: string;
  priority: Priority;
  hoursLimit: number;
  sector: { id: string; name: string };
}

export interface SectorWithCount extends Sector {
  _count?: { tickets: number };
  openTickets?: number;
}

export interface ReportData {
  period: number;
  ticketsBySector: { sectorId: string; sectorName: string; count: number }[];
  avgResolutionByPriority: { priority: string; avgHours: number }[];
  slaComplianceBySector: { sectorId: string; sectorName: string; compliance: number }[];
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}
