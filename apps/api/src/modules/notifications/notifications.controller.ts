import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get user's notifications
   */
  @Get()
  async getUserNotifications(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.notificationsService.getUserNotifications(
      user.id,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Mark notification as read
   */
  @Post(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  /**
   * Mark all notifications as read
   */
  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * Send test email (admin only)
   */
  @Post('test-email')
  @Roles('admin')
  async sendTestEmail(@Body() body: { to: string; subject: string; message: string }) {
    return this.notificationsService.sendEmail({
      to: body.to,
      subject: body.subject,
      html: `<p>${body.message}</p>`,
      text: body.message,
    });
  }

  /**
   * Get notification statistics (admin only)
   */
  @Get('stats')
  @Roles('admin', 'manager')
  async getStats(@Query('from') from?: string, @Query('to') to?: string) {
    return this.notificationsService.getStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : new Date(),
    );
  }
}
