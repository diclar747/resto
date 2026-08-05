import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; path: string }>;
}

export interface SMSOptions {
  to: string;
  message: string;
}

export interface PushNotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailTransporter: nodemailer.Transporter;
  private isEmailConfigured: boolean;
  private isTwilioConfigured: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.isEmailConfigured = this.initializeEmail();
    this.isTwilioConfigured = this.checkTwilioConfig();
  }

  private initializeEmail(): boolean {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('Email configuration incomplete. Email notifications disabled.');
      return false;
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10) || 587,
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.logger.log('Email notifications configured successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error);
      return false;
    }
  }

  private checkTwilioConfig(): boolean {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get('TWILIO_PHONE_NUMBER');

    const configured = !!(accountSid && authToken && phoneNumber);
    
    if (!configured) {
      this.logger.warn('Twilio configuration incomplete. SMS notifications disabled.');
    } else {
      this.logger.log('SMS notifications configured successfully');
    }

    return configured;
  }

  /**
   * Send email notification
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEmailConfigured) {
      this.logger.warn('Email not configured. Skipping email notification.');
      return false;
    }

    try {
      await this.emailTransporter.sendMail({
        from: `"${this.configService.get('APP_NAME', 'Restaurante')}" <${this.configService.get('SMTP_USER')}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      
      // Log notification in database
      await this.logNotification({
        type: 'EMAIL',
        recipient: Array.isArray(options.to) ? options.to[0] : options.to,
        subject: options.subject,
        status: 'SENT',
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      
      await this.logNotification({
        type: 'EMAIL',
        recipient: Array.isArray(options.to) ? options.to[0] : options.to,
        subject: options.subject,
        status: 'FAILED',
        errorMessage: error.message,
      });

      return false;
    }
  }

  /**
   * Send SMS notification via Twilio
   */
  async sendSMS(options: SMSOptions): Promise<boolean> {
    if (!this.isTwilioConfigured) {
      this.logger.warn('Twilio not configured. Skipping SMS notification.');
      return false;
    }

    try {
      // Twilio implementation would go here
      // For now, log the attempt
      this.logger.log(`SMS would be sent to ${options.to}: ${options.message}`);

      await this.logNotification({
        type: 'SMS',
        recipient: options.to,
        message: options.message,
        status: 'SENT',
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send SMS', error);
      
      await this.logNotification({
        type: 'SMS',
        recipient: options.to,
        message: options.message,
        status: 'FAILED',
        errorMessage: error.message,
      });

      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
    try {
      // Implementation for push notifications (Firebase, OneSignal, etc.)
      this.logger.log(`Push notification to user ${options.userId}: ${options.title}`);

      await this.logNotification({
        type: 'PUSH',
        userId: options.userId,
        title: options.title,
        message: options.body,
        status: 'SENT',
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      
      await this.logNotification({
        type: 'PUSH',
        userId: options.userId,
        title: options.title,
        message: options.body,
        status: 'FAILED',
        errorMessage: error.message,
      });

      return false;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        metadata: {
          readAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        metadata: {
          path: ['readAt'],
          equals: null,
        },
      },
      data: {
        metadata: {
          readAt: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Get notification statistics
   */
  async getStats(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [total, byType, byStatus] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
    };
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(orderId: string, userEmail: string, orderDetails: any): Promise<boolean> {
    const html = `
      <h1>¡Gracias por tu pedido!</h1>
      <p>Tu pedido #${orderId} ha sido confirmado.</p>
      <h2>Detalles del pedido:</h2>
      ${this.formatOrderDetails(orderDetails)}
      <p>Te avisaremos cuando esté listo.</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Confirmación de Pedido #${orderId}`,
      html,
      text: `Tu pedido #${orderId} ha sido confirmado.`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_POS_URL')}/reset-password?token=${resetToken}`;
    
    const html = `
      <h1>Restablecimiento de Contraseña</h1>
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Restablecimiento de Contraseña',
      html,
      text: `Restablece tu contraseña aquí: ${resetUrl}`,
    });
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(productId: string, productName: string, currentStock: number, threshold: number, branchName: string): Promise<boolean> {
    const adminEmail = this.configService.get('ADMIN_EMAIL');
    
    if (!adminEmail) {
      this.logger.warn('Admin email not configured. Skipping low stock alert.');
      return false;
    }

    const html = `
      <h1>⚠️ Alerta de Stock Bajo</h1>
      <p>El producto <strong>${productName}</strong> tiene stock bajo en <strong>${branchName}</strong>.</p>
      <ul>
        <li>Stock actual: ${currentStock}</li>
        <li>Umbral mínimo: ${threshold}</li>
      </ul>
      <p>Por favor, realizar reposición lo antes posible.</p>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `Alerta de Stock Bajo: ${productName}`,
      html,
      text: `El producto ${productName} tiene stock bajo (${currentStock}/${threshold}) en ${branchName}.`,
    });
  }

  /**
   * Log notification in database
   */
  private async logNotification(data: {
    type: 'EMAIL' | 'SMS' | 'PUSH';
    recipient?: string;
    userId?: string;
    subject?: string;
    message?: string;
    title?: string;
    status: 'SENT' | 'FAILED' | 'PENDING';
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          type: data.type,
          recipient: data.recipient,
          userId: data.userId,
          subject: data.subject,
          message: data.message || data.title,
          status: data.status,
          errorMessage: data.errorMessage,
          sentAt: data.status === 'SENT' ? new Date() : null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log notification', error);
    }
  }

  /**
   * Format order details for email
   */
  private formatOrderDetails(orderDetails: any): string {
    if (!orderDetails?.items) return '';

    const itemsHtml = orderDetails.items.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}x</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price}</td>
      </tr>
    `).join('');

    return `
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr>
          <td colspan="3" style="padding: 8px; border-top: 2px solid #333; text-align: right;"><strong>Total: $${orderDetails.total}</strong></td>
        </tr>
      </table>
    `;
  }
}
