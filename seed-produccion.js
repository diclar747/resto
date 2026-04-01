#!/usr/bin/env node
/**
 * Script para inicializar datos en producción
 * Uso: DATABASE_URL="..." node seed-produccion.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('=== INICIALIZANDO DATOS EN PRODUCCIÓN ===\n');
  
  // Verificar conexión
  console.log('1. Verificando conexión a BD...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Conexión OK\n');
  } catch (e) {
    console.error('   ❌ Error de conexión:', e.message);
    process.exit(1);
  }

  // 1. Crear/Roles si no existen
  console.log('2. Verificando roles...');
  const roles = [
    { name: 'superadmin', permissions: ['all'] },
    { name: 'admin', permissions: ['orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount', 'tables.view', 'tables.manage', 'kds.view', 'kds.update', 'menu.view', 'menu.manage', 'inventory.view', 'inventory.manage', 'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement', 'payments:create', 'payments:read', 'payments:refund', 'users.view', 'users.manage', 'reports.view', 'crm.view', 'crm.manage', 'promotions.view', 'promotions.manage', 'delivery.view', 'delivery.manage', 'suppliers.view', 'suppliers.manage', 'settings.manage'] },
    { name: 'cashier', permissions: ['orders.create', 'orders.view', 'orders.edit', 'orders.discount', 'tables.view', 'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement', 'payments:create', 'payments:read', 'crm.view'] },
    { name: 'waiter', permissions: ['orders.create', 'orders.view', 'orders.edit', 'tables.view', 'tables.manage', 'menu.view'] },
    { name: 'kitchen', permissions: ['kds.view', 'kds.update', 'orders.view'] },
    { name: 'manager', permissions: ['orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount', 'tables.view', 'tables.manage', 'kds.view', 'kds.update', 'menu.view', 'menu.manage', 'inventory.view', 'inventory.manage', 'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement', 'payments:create', 'payments:read', 'payments:refund', 'reports.view', 'crm.view', 'crm.manage', 'promotions.view', 'promotions.manage', 'delivery.view', 'delivery.manage', 'suppliers.view', 'suppliers.manage'] },
    { name: 'driver', permissions: ['delivery.view', 'delivery.manage', 'orders.view'] }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: { name: role.name, permissions: role.permissions }
    });
    console.log(`   ✅ Rol: ${role.name}`);
  }

  // 2. Crear sucursal principal
  console.log('\n3. Verificando sucursal principal...');
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      name: 'Restaurante Principal',
      address: 'Av. Corrientes 1234, Buenos Aires',
      phone: '+5491145678900',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      settings: {
        taxRate: 21,
        description: 'La mejor experiencia gastronómica.'
      }
    }
  });
  console.log(`   ✅ Sucursal: ${branch.name}`);

  // 3. Crear usuarios del POS con PINs
  console.log('\n4. Creando usuarios POS...');
  const users = [
    { email: 'superadmin@restaurante.com', password: 'super123', pin: '9999', firstName: 'Super', lastName: 'Admin', role: 'superadmin' },
    { email: 'admin@restaurante.com', password: 'admin123', pin: '0000', firstName: 'Admin', lastName: 'Sistema', role: 'admin' },
    { email: 'gerente@restaurante.com', password: 'manager123', pin: '4444', firstName: 'Gerente', lastName: 'Regional', role: 'manager' },
    { email: 'cajero@restaurante.com', password: 'cajero123', pin: '2222', firstName: 'Cajero', lastName: 'Principal', role: 'cashier' },
    { email: 'camarero@restaurante.com', password: 'waiter123', pin: '1111', firstName: 'Camarero', lastName: 'Uno', role: 'waiter' },
    { email: 'camarero2@restaurante.com', password: 'waiter123', pin: '6666', firstName: 'Camarero', lastName: 'Dos', role: 'waiter' },
    { email: 'cocina@restaurante.com', password: 'cocina123', pin: '3333', firstName: 'Jefe', lastName: 'Cocina', role: 'kitchen' },
    { email: 'delivery@restaurante.com', password: 'driver123', pin: '5555', firstName: 'Repartidor', lastName: 'Express', role: 'driver' },
    { email: 'demo1@restaurante.com', password: 'demo123', pin: '7777', firstName: 'Demo', lastName: 'User 1', role: 'waiter' },
    { email: 'demo2@restaurante.com', password: 'demo123', pin: '8888', firstName: 'Demo', lastName: 'User 2', role: 'waiter' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hash,
        pin: u.pin,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true
      },
      create: {
        email: u.email,
        passwordHash: hash,
        pin: u.pin,
        firstName: u.firstName,
        lastName: u.lastName,
        isActive: true,
        branches: {
          create: {
            branchId: branch.id,
            roleId: role.id
          }
        }
      }
    });
    console.log(`   ✅ Usuario: ${u.email} (PIN: ${u.pin})`);
  }

  // 4. Crear clientes marketplace con PINs
  console.log('\n5. Creando clientes marketplace...');
  const clients = [
    { firstName: 'Juan', lastName: 'Pérez', email: 'juan@gmail.com', phone: '+595981111111', pin: '1234' },
    { firstName: 'María', lastName: 'González', email: 'maria@gmail.com', phone: '+595982222222', pin: '5678' },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos@gmail.com', phone: '+595983333333', pin: '4321' },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana@gmail.com', phone: '+595984444444', pin: '8765' },
    { firstName: 'Roberto', lastName: 'Fernández', email: 'roberto@gmail.com', phone: '+595985555555', pin: '1122' },
  ];

  for (const c of clients) {
    const hash = await bcrypt.hash('cliente123', 10);
    await prisma.client.upsert({
      where: { email: c.email },
      update: {
        pin: c.pin,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        passwordHash: hash,
        isActive: true
      },
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
    console.log(`   ✅ Cliente: ${c.email} (PIN: ${c.pin})`);
  }

  // Verificación final
  console.log('\n6. Verificación final:');
  const totalUsers = await prisma.user.count();
  const totalClients = await prisma.client.count();
  const clientsWithPin = await prisma.client.count({ where: { pin: { not: null } } });
  
  console.log(`   👥 Usuarios POS: ${totalUsers}`);
  console.log(`   👤 Clientes: ${totalClients}`);
  console.log(`   🔢 Clientes con PIN: ${clientsWithPin}`);

  console.log('\n=== ✅ DATOS INICIALIZADOS CORRECTAMENTE ===');
  console.log('\n📋 CREDENCIALES PARA PROBAR:');
  console.log('\nMarketplace (App Clientes):');
  console.log('  PIN: 1234 -> Juan Pérez');
  console.log('  PIN: 5678 -> María González');
  console.log('  Email: juan@gmail.com / Contraseña: cliente123');
  console.log('\nPOS (Staff):');
  console.log('  PIN: 0000 -> Admin');
  console.log('  PIN: 1111 -> Camarero');
  console.log('  PIN: 2222 -> Cajero');
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
