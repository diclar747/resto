import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  // 1. Dependent transaction tables
  await prisma.auditLog.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.loyaltyHistory.deleteMany();
  await prisma.kdsTicketItem.deleteMany();
  await prisma.kdsTicket.deleteMany();
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashRegisterMovement.deleteMany();
  await prisma.order.deleteMany();
  await prisma.branchReview.deleteMany();

  // 2. Product and Menu dependencies
  await prisma.productModifierGroup.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.productBranch.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.comboItem.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 3. Infrastructure and Inventory
  await prisma.wasteRecord.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplierBranch.deleteMany();
  await prisma.accountPayable.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.kitchenStation.deleteMany();
  await prisma.table.deleteMany();
  await prisma.cashRegister.deleteMany();

  // 4. Identity and Core
  await prisma.client.deleteMany();
  await prisma.userBranch.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.role.deleteMany();

  console.log('Seeding database...');

  // 1. Create roles
  const superadminPermissions = [
    'branches.manage', 'branches.view',
    'users.manage', 'users.view',
    'orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount',
    'tables.view', 'tables.manage',
    'kds.view', 'kds.update',
    'menu.view', 'menu.manage',
    'inventory.view', 'inventory.manage',
    'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement',
    'payments:create', 'payments:read', 'payments:refund',
    'reports.view', 'audit.view',
    'crm.view', 'crm.manage',
    'promotions.view', 'promotions.manage',
    'delivery.view', 'delivery.manage',
    'suppliers.view', 'suppliers.manage',
    'settings.manage',
  ];
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: { permissions: superadminPermissions },
    create: { name: 'superadmin', permissions: superadminPermissions },
  });

  const adminPermissions = [
    'orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount',
    'tables.view', 'tables.manage',
    'kds.view', 'kds.update',
    'menu.view', 'menu.manage',
    'inventory.view', 'inventory.manage',
    'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement',
    'payments:create', 'payments:read', 'payments:refund',
    'users.view', 'users.manage',
    'reports.view',
    'crm.view', 'crm.manage',
    'promotions.view', 'promotions.manage',
    'delivery.view', 'delivery.manage',
    'suppliers.view', 'suppliers.manage',
    'settings.manage',
  ];
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { permissions: adminPermissions },
    create: { name: 'admin', permissions: adminPermissions },
  });

  const cashierPermissions = [
    'orders.create', 'orders.view', 'orders.edit', 'orders.discount',
    'tables.view',
    'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement',
    'payments:create', 'payments:read',
    'crm.view',
  ];
  const cashierRole = await prisma.role.upsert({
    where: { name: 'cashier' },
    update: { permissions: cashierPermissions },
    create: { name: 'cashier', permissions: cashierPermissions },
  });

  const waiterPermissions = [
    'orders.create', 'orders.view', 'orders.edit',
    'tables.view', 'tables.manage',
    'menu.view',
  ];
  const waiterRole = await prisma.role.upsert({
    where: { name: 'waiter' },
    update: { permissions: waiterPermissions },
    create: { name: 'waiter', permissions: waiterPermissions },
  });

  const kitchenPermissions = ['kds.view', 'kds.update', 'orders.view'];
  const kitchenRole = await prisma.role.upsert({
    where: { name: 'kitchen' },
    update: { permissions: kitchenPermissions },
    create: { name: 'kitchen', permissions: kitchenPermissions },
  });

  const managerPermissions = [
    'orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount',
    'tables.view', 'tables.manage',
    'kds.view', 'kds.update',
    'menu.view', 'menu.manage',
    'inventory.view', 'inventory.manage',
    'cash_register:open', 'cash_register:close', 'cash_register:read', 'cash_register:movement',
    'payments:create', 'payments:read', 'payments:refund',
    'reports.view',
    'crm.view', 'crm.manage',
    'promotions.view', 'promotions.manage',
    'delivery.view', 'delivery.manage',
    'suppliers.view', 'suppliers.manage',
  ];
  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: { permissions: managerPermissions },
    create: { name: 'manager', permissions: managerPermissions },
  });

  const driverPermissions = ['delivery.view', 'delivery.manage', 'orders.view'];
  const driverRole = await prisma.role.upsert({
    where: { name: 'driver' },
    update: { permissions: driverPermissions },
    create: { name: 'driver', permissions: driverPermissions },
  });

  // 2. Create branches
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
      bannerUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80',
      settings: {
        taxRate: 21,
        logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop',
        headerUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=400&fit=crop',
        description: 'La mejor experiencia gastronómica en el corazón de la ciudad.',
      },
    },
  });

  const branchPizza = await prisma.branch.upsert({
    where: { id: 'branch-pizza' },
    update: {},
    create: {
      id: 'branch-pizza',
      name: 'Bella Napoli - Gourmet Pizza',
      address: 'Calle Falsa 123, Buenos Aires',
      phone: '+5491100001111',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
      settings: {
        taxRate: 21,
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop',
        headerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=400&fit=crop',
        description: 'Auténtica pizza napolitana al horno de leña.',
      },
    },
  });

  const branchBurger = await prisma.branch.upsert({
    where: { id: 'branch-burger' },
    update: {},
    create: {
      id: 'branch-burger',
      name: 'Burger Craft - Artisan',
      address: 'Av. Libertador 4500, Buenos Aires',
      phone: '+5491122223333',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      bannerUrl: 'https://images.unsplash.com/photo-1571091718767-18b5c1457add?w=1200&q=80',
      settings: {
        taxRate: 21,
        logoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5c1457add?w=200&h=200&fit=crop',
        headerUrl: 'https://images.unsplash.com/photo-1571091718767-18b5c1457add?w=1200&h=400&fit=crop',
        description: 'Hamburguesas de autor con los mejores ingredientes locales.',
      },
    },
  });

  const branchCafe = await prisma.branch.upsert({
    where: { id: 'branch-cafe' },
    update: {},
    create: {
      id: 'branch-cafe',
      name: 'The Coffee Lab',
      address: 'Plaza de Mayo 1, Buenos Aires',
      phone: '+5491144445555',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      bannerUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
      settings: {
        taxRate: 21,
        logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
        headerUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=400&fit=crop',
        description: 'Café de especialidad y pastelería artesanal.',
      },
    },
  });

  const branchSushi = await prisma.branch.upsert({
    where: { id: 'branch-sushi' },
    update: {},
    create: {
      id: 'branch-sushi',
      name: 'Sakura Sushi Bar',
      address: 'Calle Florida 500, Buenos Aires',
      phone: '+5491199998888',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      bannerUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80',
      settings: {
        taxRate: 21,
        logoUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop',
        headerUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&h=400&fit=crop',
        description: 'Lo mejor de la cocina japonesa tradicional y fusión.',
      },
    },
  });

  // 2.1 Create Reviews for Marketplace
  const demoReviews = [
    { branchId: branchPizza.id, userName: 'Juan Pérez', rating: 5, comment: 'La mejor pizza que he probado!' },
    { branchId: branchPizza.id, userName: 'Maria G.', rating: 4, comment: 'Muy rica, pero tardó un poquito.' },
    { branchId: branchBurger.id, userName: 'Carlos M.', rating: 5, comment: 'La hamburguesa Craft es increíble.' },
    { branchId: branchCafe.id, userName: 'Lucía S.', rating: 5, comment: 'El ambiente es perfecto para trabajar.' },
  ];

  for (const review of demoReviews) {
    await prisma.branchReview.create({ data: review });
  }

  // 2.2 Create demo clients for marketplace
  const clientsData = [
    { firstName: 'Juan', lastName: 'Pérez', email: 'juan@gmail.com', phone: '+595981111111', password: 'cliente123', pin: '1234' },
    { firstName: 'María', lastName: 'González', email: 'maria@gmail.com', phone: '+595982222222', password: 'cliente123', pin: '5678' },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos@gmail.com', phone: '+595983333333', password: 'cliente123', pin: '4321' },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana@gmail.com', phone: '+595984444444', password: 'cliente123', pin: '8765' },
    { firstName: 'Roberto', lastName: 'Fernández', email: 'roberto@gmail.com', phone: '+595985555555', password: 'cliente123', pin: '1122' },
  ];

  for (const c of clientsData) {
    const clientHash = await bcrypt.hash(c.password, 10);
    await prisma.client.upsert({
      where: { email: c.email },
      update: {},
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        passwordHash: clientHash,
        pin: c.pin,
        loyaltyPoints: Math.floor(Math.random() * 500),
        visitCount: Math.floor(Math.random() * 20),
      },
    });
  }

  // 3. Create users

  // Create waiter user
  const waiterHash = await bcrypt.hash('waiter123', 10);
  const waiterUser = await prisma.user.upsert({
    where: { email: 'camarero@restaurante.com' },
    update: {
      pin: '1111',
      passwordHash: waiterHash,
      firstName: 'Carlos',
      lastName: 'Camarero'
    },
    create: {
      email: 'camarero@restaurante.com',
      passwordHash: waiterHash,
      firstName: 'Carlos',
      lastName: 'Camarero',
      pin: '1111',
      branches: {
        create: {
          branchId: branch.id,
          roleId: waiterRole.id,
        },
      },
    },
  });

  // Create cashier user
  const cashierHash = await bcrypt.hash('cajero123', 10);
  await prisma.user.upsert({
    where: { email: 'cajero@restaurante.com' },
    update: {
      pin: '2222',
      passwordHash: cashierHash,
      firstName: 'María',
      lastName: 'Cajera'
    },
    create: {
      email: 'cajero@restaurante.com',
      passwordHash: cashierHash,
      firstName: 'María',
      lastName: 'Cajera',
      pin: '2222',
      branches: {
        create: {
          branchId: branch.id,
          roleId: cashierRole.id,
        },
      },
    },
  });

  // Create kitchen user
  const kitchenHash = await bcrypt.hash('cocina123', 10);
  await prisma.user.upsert({
    where: { email: 'cocina@restaurante.com' },
    update: {
      pin: '3333',
      passwordHash: kitchenHash,
      firstName: 'Pedro',
      lastName: 'Cocinero'
    },
    create: {
      email: 'cocina@restaurante.com',
      passwordHash: kitchenHash,
      firstName: 'Pedro',
      lastName: 'Cocinero',
      pin: '3333',
      branches: {
        create: {
          branchId: branch.id,
          roleId: kitchenRole.id,
        },
      },
    },
  });

  // 3. Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {
      pin: '0000',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema'
    },
    create: {
      email: 'admin@restaurante.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      pin: '0000',
      branches: {
        create: { branchId: branch.id, roleId: adminRole.id },
      },
    },
  });

  // Create superadmin user
  const superHash = await bcrypt.hash('super123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@restaurante.com' },
    update: {
      pin: '9999',
      passwordHash: superHash,
      firstName: 'Super',
      lastName: 'Admin'
    },
    create: {
      email: 'superadmin@restaurante.com',
      passwordHash: superHash,
      firstName: 'Super',
      lastName: 'Admin',
      pin: '9999',
      branches: {
        create: {
          branchId: branch.id,
          roleId: superAdminRole.id,
        },
      },
    },
  });

  // Create driver user
  const driverHash = await bcrypt.hash('driver123', 10);
  await prisma.user.upsert({
    where: { email: 'delivery@restaurante.com' },
    update: {
      pin: '5555',
      passwordHash: driverHash,
      firstName: 'Diego',
      lastName: 'Repartidor'
    },
    create: {
      email: 'delivery@restaurante.com',
      passwordHash: driverHash,
      firstName: 'Diego',
      lastName: 'Repartidor',
      pin: '5555',
      branches: {
        create: {
          branchId: branch.id,
          roleId: driverRole.id,
        },
      },
    },
  });

  // Create manager user
  const managerHash = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'gerente@restaurante.com' },
    update: {
      pin: '4444',
      passwordHash: managerHash,
      firstName: 'Laura',
      lastName: 'Gerente'
    },
    create: {
      email: 'gerente@restaurante.com',
      passwordHash: managerHash,
      firstName: 'Laura',
      lastName: 'Gerente',
      pin: '4444',
      branches: {
        create: {
          branchId: branch.id,
          roleId: managerRole.id,
        },
      },
    },
  });

  // Create second waiter
  const waiter2Hash = await bcrypt.hash('waiter123', 10);
  await prisma.user.upsert({
    where: { email: 'camarero2@restaurante.com' },
    update: {
      pin: '6666',
      passwordHash: waiter2Hash,
      firstName: 'Ana',
      lastName: 'Camarera'
    },
    create: {
      email: 'camarero2@restaurante.com',
      passwordHash: waiter2Hash,
      firstName: 'Ana',
      lastName: 'Camarera',
      pin: '6666',
      branches: {
        create: {
          branchId: branch.id,
          roleId: waiterRole.id,
        },
      },
    },
  });

  // 4. Create kitchen stations
  const grillStation = await prisma.kitchenStation.create({
    data: { branchId: branch.id, name: 'Parrilla', color: '#EF4444' },
  });
  const coldStation = await prisma.kitchenStation.create({
    data: { branchId: branch.id, name: 'Cocina Fría', color: '#3B82F6' },
  });
  const barStation = await prisma.kitchenStation.create({
    data: { branchId: branch.id, name: 'Bar', color: '#F59E0B' },
  });
  const dessertStation = await prisma.kitchenStation.create({
    data: { branchId: branch.id, name: 'Postres', color: '#EC4899' },
  });

  // 5. Create categories and products
  const bebidas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Bebidas', sortOrder: 1, imageUrl: 'https://images.unsplash.com/photo-1544145945-f904253d0c7e?w=800&q=80' },
  });
  const entradas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Entradas', sortOrder: 2, imageUrl: 'https://images.unsplash.com/photo-1541014741259-df549fa9ba1c?w=800&q=80' },
  });
  const principales = await prisma.category.create({
    data: { branchId: branch.id, name: 'Platos Principales', sortOrder: 3, imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80' },
  });
  const pizzas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Pizzas', sortOrder: 4, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  });
  const pastas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Pastas', sortOrder: 5, imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80' },
  });
  const sopas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Sopas y Cremas', sortOrder: 6, imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80' },
  });
  const hamburguesas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Hamburguesas', sortOrder: 7, imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5c1457add?w=800&q=80' },
  });
  const postres = await prisma.category.create({
    data: { branchId: branch.id, name: 'Postres', sortOrder: 8, imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' },
  });

  // --- Bebidas ---
  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Vino Malbec Premium',
      kitchenStationId: barStation.id,
      description: 'Vino tinto reserva de Mendoza, notas de ciruela y vainilla.',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
      variants: {
        create: [
          { name: 'Copa', price: 2500, isDefault: true },
          { name: 'Botella', price: 9500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Limonada con Menta y Jengibre',
      kitchenStationId: barStation.id,
      description: 'Refrescante limonada natural con menta fresca y jengibre.',
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80',
      variants: {
        create: [{ name: 'Jarra 1L', price: 2800, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Coca Cola Original',
      kitchenStationId: barStation.id,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80',
      variants: {
        create: [
          { name: '500ml', price: 1500, isDefault: true },
          { name: '1.5L', price: 2500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Entradas ---
  await prisma.product.create({
    data: {
      categoryId: entradas.id,
      name: 'Empanadas Salteñas',
      kitchenStationId: grillStation.id,
      imageUrl: 'https://images.unsplash.com/photo-1628815418296-41e988229bca?w=800&q=80',
      prepTime: 10,
      variants: {
        create: [
          { name: 'Carne Cortada a Cuchillo', price: 950, isDefault: true },
          { name: 'Jamón y Queso Premium', price: 950 },
          { name: 'Humita de la Casa', price: 950 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: entradas.id,
      name: 'Provoleta a la Parrilla',
      kitchenStationId: grillStation.id,
      description: 'Queso provolone fundido con orégano y un toque de oliva.',
      imageUrl: 'https://images.unsplash.com/photo-1559561853-08451507c73a?w=800&q=80',
      prepTime: 8,
      variants: {
        create: [{ name: 'Porción', price: 3800, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Platos Principales ---
  await prisma.product.create({
    data: {
      categoryId: principales.id,
      name: 'Milanesa Napolitana RestoPOS',
      kitchenStationId: grillStation.id,
      description: 'Milanesa de ternera con salsa pomodoro, jamón y mozzarella.',
      imageUrl: 'https://images.unsplash.com/photo-1606149059549-6042addafc5a?w=800&q=80',
      prepTime: 15,
      variants: {
        create: [
          { name: 'Con Papas Fritas', price: 7800, isDefault: true },
          { name: 'Con Ensalada Mixta', price: 7800 },
          { name: 'Con Puré Duquesa', price: 8200 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: principales.id,
      name: 'Ojo de Bife 400g',
      kitchenStationId: grillStation.id,
      description: 'Corte premium a la parrilla en su punto justo.',
      imageUrl: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?w=800&q=80',
      prepTime: 20,
      variants: {
        create: [
          { name: 'Al Punto', price: 11500, isDefault: true },
          { name: 'Cocido', price: 11500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Pizzas ---
  await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Cuatro Quesos',
      kitchenStationId: grillStation.id,
      description: 'Mozzarella, Roquefort, Parmesano y Provolone sobre masa artesanal.',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
      prepTime: 15,
      variants: {
        create: [
          { name: 'Grande (8 porciones)', price: 8500, isDefault: true },
          { name: 'Mediana (6 porciones)', price: 6500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Especial de la Casa',
      kitchenStationId: grillStation.id,
      description: 'Mozzarella, jamón cocido, morrones asados y aceitunas negras.',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      prepTime: 12,
      variants: {
        create: [{ name: 'Grande', price: 9200, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Sopas y Cremas ---
  await prisma.product.create({
    data: {
      categoryId: sopas.id,
      name: 'Crema de Zapallo y Jengibre',
      kitchenStationId: coldStation.id,
      description: 'Sopa cremosa servida con croutons aromatizados y crema.',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
      prepTime: 10,
      variants: {
        create: [{ name: 'Tazón', price: 3400, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: sopas.id,
      name: 'Sopa de Cebolla Tradicional',
      kitchenStationId: coldStation.id,
      description: 'Sopa de cebolla caramelizada gratinada con queso parmesano.',
      imageUrl: 'https://images.unsplash.com/photo-1511910849309-0dffb8785146?w=800&q=80',
      prepTime: 12,
      variants: {
        create: [{ name: 'Tazón', price: 3600, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Pastas ---
  await prisma.product.create({
    data: {
      categoryId: pastas.id,
      name: 'Sorrentinos de Calabaza',
      kitchenStationId: grillStation.id,
      description: 'Pasta artesanal de calabaza y mozzarella con nueces.',
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80',
      prepTime: 12,
      variants: {
        create: [
          { name: 'Con Salsa Rose', price: 6200, isDefault: true },
          { name: 'Con Crema de Ciboulette', price: 6500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Hamburguesas ---
  const hamburguesa = await prisma.product.create({
    data: {
      categoryId: hamburguesas.id,
      name: 'Hamburguesa Premium Resto',
      kitchenStationId: grillStation.id,
      description: 'Blend de carne seleccionada, queso cheddar, bacon crocante y cebolla al malbec.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      prepTime: 12,
      variants: {
        create: [
          { name: 'Simple', price: 5500, isDefault: true },
          { name: 'Doble Burguer', price: 7800 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- Postres ---
  await prisma.product.create({
    data: {
      categoryId: postres.id,
      name: 'Volcán de Chocolate',
      kitchenStationId: dessertStation.id,
      description: 'Bizcocho tibio de chocolate con corazón fundido y helado de crema.',
      imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
      prepTime: 15,
      variants: {
        create: [{ name: 'Individual', price: 4200, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // --- SEED MENU FOR DEMO BRANCHES ---

  // PIZZA BRANCH MENU
  const catPizzaOnly = await prisma.category.create({
    data: { branchId: branchPizza.id, name: 'Pizzas Artesanales', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' }
  });
  await prisma.product.create({
    data: {
      categoryId: catPizzaOnly.id,
      name: 'Pizza Margherita Napoli',
      description: 'Tomate San Marzano, mozzarella di bufala, albahaca fresca y aceite de oliva.',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?w=800&q=80',
      variants: { create: [{ name: 'Grande', price: 9500, isDefault: true }] },
      branches: { create: { branchId: branchPizza.id } }
    }
  });
  await prisma.product.create({
    data: {
      categoryId: catPizzaOnly.id,
      name: 'Pizza Diávola',
      description: 'Para los amantes del picante: salame picante, mozzarella y peperoncino.',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&q=80',
      variants: { create: [{ name: 'Grande', price: 10500, isDefault: true }] },
      branches: { create: { branchId: branchPizza.id } }
    }
  });

  // BURGER BRANCH MENU
  const catBurgerOnly = await prisma.category.create({
    data: { branchId: branchBurger.id, name: 'Burgers Gourmet', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5c1457add?w=800&q=80' }
  });
  await prisma.product.create({
    data: {
      categoryId: catBurgerOnly.id,
      name: 'Truffle Burger',
      description: '200g de carne, mayonesa de trufa, hongos salteados y queso suizo.',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
      variants: { create: [{ name: 'Con Papas', price: 8500, isDefault: true }] },
      branches: { create: { branchId: branchBurger.id } }
    }
  });

  // CAFE BRANCH MENU
  const catCafeOnly = await prisma.category.create({
    data: { branchId: branchCafe.id, name: 'Specialty Coffee', imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80' }
  });
  await prisma.product.create({
    data: {
      categoryId: catCafeOnly.id,
      name: 'Flat White Lab',
      description: 'Doble shot de espresso con leche microespumada.',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      variants: { create: [{ name: 'Normal', price: 3200, isDefault: true }] },
      branches: { create: { branchId: branchCafe.id } }
    }
  });

  // SUSHI BRANCH MENU
  const catSushiOnly = await prisma.category.create({
    data: { branchId: branchSushi.id, name: 'Asian Fusion', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80' }
  });
  await prisma.product.create({
    data: {
      categoryId: catSushiOnly.id,
      name: 'Combo Omakase (15 pzs)',
      description: 'Selección del chef con los pescados más frescos del día.',
      imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
      variants: { create: [{ name: 'Combo', price: 15500, isDefault: true }] },
      branches: { create: { branchId: branchSushi.id } }
    }
  });

  // 6. Create tables
  const tables = [];
  for (let i = 1; i <= 15; i++) {
    const zone = i <= 8 ? 'Salón Principal' : i <= 12 ? 'Terraza VIP' : 'Barra';
    const row = Math.floor((i - 1) / 4);
    const col = (i - 1) % 4;

    tables.push(
      prisma.table.create({
        data: {
          branchId: branch.id,
          number: i,
          name: `Mesa ${i}`,
          zone,
          capacity: i <= 8 ? 4 : i <= 12 ? 6 : 1,
          posX: col * 160 + 40,
          posY: row * 160 + 40,
          shape: i <= 12 ? 'square' : 'round',
          qrCode: `table-${branch.id}-${i}`,
        },
      }),
    );
  }
  await Promise.all(tables);

  // 7. Create sample ingredients & stock
  const queso = await prisma.ingredient.create({ data: { name: 'Queso Mozzarella', unit: 'kg', costPerUnit: 3500 } });
  const carne = await prisma.ingredient.create({ data: { name: 'Carne Seleccionada', unit: 'kg', costPerUnit: 5500 } });
  const harina = await prisma.ingredient.create({ data: { name: 'Harina Orgánica', unit: 'kg', costPerUnit: 800 } });

  await prisma.stockItem.createMany({
    data: [
      { branchId: branch.id, ingredientId: queso.id, currentStock: 50, minStock: 10 },
      { branchId: branch.id, ingredientId: carne.id, currentStock: 100, minStock: 20 },
      { branchId: branch.id, ingredientId: harina.id, currentStock: 200, minStock: 50 },
    ],
  });

  console.log('=== SEED COMPLETADO CON ÉXITO ===');
  console.log('');
  console.log('USUARIOS STAFF:');
  console.log('┌─────────────────────────────────┬──────────────┬──────┬────────────┐');
  console.log('│ Email                           │ Password     │ PIN  │ Rol        │');
  console.log('├─────────────────────────────────┼──────────────┼──────┼────────────┤');
  console.log('│ superadmin@restaurante.com       │ super123     │ 9999 │ superadmin │');
  console.log('│ admin@restaurante.com            │ admin123     │ 0000 │ admin      │');
  console.log('│ gerente@restaurante.com          │ manager123   │ 4444 │ manager    │');
  console.log('│ cajero@restaurante.com           │ cajero123    │ 2222 │ cashier    │');
  console.log('│ camarero@restaurante.com         │ waiter123    │ 1111 │ waiter     │');
  console.log('│ camarero2@restaurante.com        │ waiter123    │ 6666 │ waiter     │');
  console.log('│ cocina@restaurante.com           │ cocina123    │ 3333 │ kitchen    │');
  console.log('│ delivery@restaurante.com         │ driver123    │ 5555 │ driver     │');
  console.log('└─────────────────────────────────┴──────────────┴──────┴────────────┘');
  console.log('');
  console.log('CLIENTES MARKETPLACE:');
  console.log('┌──────────────────────┬──────────────┬──────┬───────────────────┐');
  console.log('│ Email                │ Password     │ PIN  │ Teléfono          │');
  console.log('├──────────────────────┼──────────────┼──────┼───────────────────┤');
  console.log('│ juan@gmail.com       │ cliente123   │ 1234 │ +595981111111     │');
  console.log('│ maria@gmail.com      │ cliente123   │ 5678 │ +595982222222     │');
  console.log('│ carlos@gmail.com     │ cliente123   │ 4321 │ +595983333333     │');
  console.log('│ ana@gmail.com        │ cliente123   │ 8765 │ +595984444444     │');
  console.log('│ roberto@gmail.com    │ cliente123   │ 1122 │ +595985555555     │');
  console.log('└──────────────────────┴──────────────┴──────┴───────────────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
