import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Priority, TicketStatus } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { id: string; email: string; role: string; sectorId: string | null };
}

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tickets com filtros' })
  @ApiQuery({ name: 'status', enum: TicketStatus, required: false })
  @ApiQuery({ name: 'priority', enum: Priority, required: false })
  @ApiQuery({ name: 'sectorId', required: false })
  @ApiQuery({ name: 'responsibleId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() filter: FilterTicketsDto) {
    return this.ticketsService.findAll(filter);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Tickets agrupados por status para o Kanban' })
  @ApiQuery({ name: 'sectorId', required: false })
  findKanban(@Query('sectorId') sectorId?: string) {
    return this.ticketsService.findKanban(sectorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar ticket por ID com timeline completa' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo ticket manualmente' })
  create(@Body() dto: CreateTicketDto, @Request() req: AuthenticatedRequest) {
    return this.ticketsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar campos do ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Alterar status do ticket (registra na timeline)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.updateStatus(id, dto, req.user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Adicionar comentário interno ao ticket' })
  addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.addComment(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar ticket (soft delete via status)' })
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.ticketsService.remove(id, req.user.id);
  }
}
