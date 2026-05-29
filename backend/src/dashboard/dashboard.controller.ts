import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs operacionais em tempo real' })
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Relatórios agregados por período' })
  getReports(@Query('period', new DefaultValuePipe(30), ParseIntPipe) period: number) {
    return this.dashboardService.getReports(period);
  }
}
