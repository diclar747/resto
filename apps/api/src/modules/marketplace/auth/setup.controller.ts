import { Controller, Post, Logger, Body, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('marketplace/setup')
export class SetupController {
  private readonly logger = new Logger(SetupController.name);

  constructor(private prisma: PrismaService) {}

  @Post('init')
  async initData(@Body() body: { secret?: string }) {
    // Protección simple - requiere un secret
    if (body.secret !== 'resto-setup-2024') {
      throw new UnauthorizedException('Secret inválido');
    }

    this.logger.log('=== INICIALIZANDO DATOS ===');
    const results = [];

    try {
      // 1. Crear roles
      this.logger.log('Creando roles...');
      const roles = [
        { name: 'superadmin', permissions: ['all'] },
        { name: 'admin', permissions: ['orders.create', 'orders.view', 'menu.view', 'menu.manage'] },
        { name: 'cashier', permissions: ['orders.create', 'orders.view', 'payments:create'] },
        { name: 'waiter', permissions: ['orders.create', 'orders.view', 'tables.view'] },
        { name: 'kitchen', permissions: ['kds.view', 'kds.update'] },
        { name: 'manager', permissions: ['orders.view', 'reports.view', 'menu.view'] },
        { name: 'driver', permissions: ['delivery.view', 'orders.view'] }
      ];

      for (const role of roles) {
        await this.prisma.role.upsert({
          where: { name: role.name },
          update: {},
          create: { name: role.name, permissions: role.permissions }
        });
      }
      results.push(`✅ ${roles.length} roles creados`);

      // 2. Crear sucursal
      this.logger.log('Creando sucursal...');
      const branch = await this.prisma.branch.upsert({
        where: { id: 'branch-main' },
        update: {},
        create: {
          id: 'branch-main',
          name: 'Restaurante Principal',
          address: 'Av. Corrientes 1234, Buenos Aires',
          phone: '+5491145678900',
          timezone: 'America/Argentina/Buenos_Aires',
          currency: 'ARS'
        }
      });
      results.push(`✅ Sucursal: ${branch.name}`);

      // 3. Crear usuarios POS
      this.logger.log('Creando usuarios POS...');
      const users = [
        { email: 'admin@restaurante.com', password: 'admin123', pin: '0000', firstName: 'Admin', lastName: 'Sistema', role: 'admin' },
        { email: 'camarero@restaurante.com', password: 'waiter123', pin: '1111', firstName: 'Camarero', lastName: 'Uno', role: 'waiter' },
        { email: 'cajero@restaurante.com', password: 'cajero123', pin: '2222', firstName: 'Cajero', lastName: 'Principal', role: 'cashier' },
        { email: 'cocina@restaurante.com', password: 'cocina123', pin: '3333', firstName: 'Jefe', lastName: 'Cocina', role: 'kitchen' },
      ];

      for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        const role = await this.prisma.role.findUnique({ where: { name: u.role } });
        if (!role) {
          this.logger.warn(`Rol no encontrado: ${u.role}`);
          continue;
        }
        await this.prisma.user.upsert({
          where: { email: u.email },
          update: { passwordHash: hash, pin: u.pin, isActive: true },
          create: {
            email: u.email,
            passwordHash: hash,
            pin: u.pin,
            firstName: u.firstName,
            lastName: u.lastName,
            isActive: true,
            branches: { create: { branchId: branch.id, roleId: role.id } }
          }
        });
      }
      results.push(`✅ ${users.length} usuarios POS creados`);

      // 4. Crear clientes marketplace
      this.logger.log('Creando clientes marketplace...');
      const clients = [
        { firstName: 'Juan', lastName: 'Pérez', email: 'juan@gmail.com', phone: '+595981111111', pin: '1234' },
        { firstName: 'María', lastName: 'González', email: 'maria@gmail.com', phone: '+595982222222', pin: '5678' },
        { firstName: 'Carlos', lastName: 'López', email: 'carlos@gmail.com', phone: '+595983333333', pin: '4321' },
        { firstName: 'Ana', lastName: 'Martínez', email: 'ana@gmail.com', phone: '+595984444444', pin: '8765' },
        { firstName: 'Roberto', lastName: 'Fernández', email: 'roberto@gmail.com', phone: '+595985555555', pin: '1122' },
      ];

      for (const c of clients) {
        const hash = await bcrypt.hash('cliente123', 10);
        await this.prisma.client.upsert({
          where: { email: c.email },
          update: { pin: c.pin, passwordHash: hash, isActive: true },
          create: {
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            passwordHash: hash,
            pin: c.pin,
            isActive: true
          }
        });
      }
      results.push(`✅ ${clients.length} clientes marketplace creados`);

      // Verificación
      const totalClients = await this.prisma.client.count();
      const clientsWithPin = await this.prisma.client.count({ where: { pin: { not: null } } });

      return {
        success: true,
        message: 'Datos inicializados correctamente',
        results,
        summary: {
          totalClients,
          clientsWithPin
        }
      };

    } catch (error) {
      this.logger.error('Error inicializando datos:', error);
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }
}
