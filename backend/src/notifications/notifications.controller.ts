import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.findForUser(req.user.sub);
  }

  @Get('unread-count')
  countUnread(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.countUnread(req.user.sub);
  }

  @Patch('mark-all-read')
  markAllRead(@Request() req: { user: { sub: string } }) {
    return this.notificationsService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markOneRead(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.notificationsService.markOneRead(id, req.user.sub);
  }
}
