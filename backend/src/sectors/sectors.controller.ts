import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Sectors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sectors')
export class SectorsController {
  constructor(private sectorsService: SectorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os setores' })
  findAll() { return this.sectorsService.findAll(); }

  @Get('sla-config')
  @ApiOperation({ summary: 'Listar todas as configurações SLA' })
  findAllSlaConfig() { return this.sectorsService.findAllSlaConfig(); }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar setor por ID' })
  findOne(@Param('id') id: string) { return this.sectorsService.findOne(id); }

  @Patch(':id/sla-config')
  @Roles(Role.administrador, Role.gerente, Role.coordenador)
  @ApiOperation({ summary: 'Atualizar configuração SLA de um setor' })
  upsertSlaConfig(
    @Param('id') id: string,
    @Body() body: { priority: string; hoursLimit: number },
  ) { return this.sectorsService.upsertSlaConfig(id, body.priority, body.hoursLimit); }

  @Post()
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Criar novo setor' })
  create(@Body() dto: CreateSectorDto) { return this.sectorsService.create(dto); }

  @Patch(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Atualizar setor' })
  update(@Param('id') id: string, @Body() dto: UpdateSectorDto) { return this.sectorsService.update(id, dto); }

  @Delete(':id')
  @Roles(Role.administrador)
  @ApiOperation({ summary: 'Remover setor' })
  remove(@Param('id') id: string) { return this.sectorsService.remove(id); }
}
