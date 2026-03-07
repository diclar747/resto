import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      permissions: [
        'orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount',
        'tables.view', 'tables.manage',
        'kds.view', 'kds.update',
        'menu.view', 'menu.manage',
        'inventory.view', 'inventory.manage',
        'cash.view', 'cash.manage',
        'users.view', 'users.manage',
        'reports.view',
        'crm.view', 'crm.manage',
        'promotions.view', 'promotions.manage',
        'delivery.view', 'delivery.manage',
        'suppliers.view', 'suppliers.manage',
        'branches.manage', 'settings.manage',
      ],
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      permissions: [
        'orders.create', 'orders.view', 'orders.edit', 'orders.void', 'orders.discount',
        'tables.view', 'tables.manage',
        'kds.view', 'kds.update',
        'menu.view', 'menu.manage',
        'inventory.view', 'inventory.manage',
        'cash.view', 'cash.manage',
        'users.view',
        'reports.view',
        'crm.view', 'crm.manage',
        'promotions.view', 'promotions.manage',
        'delivery.view', 'delivery.manage',
        'suppliers.view', 'suppliers.manage',
      ],
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'cashier' },
    update: {},
    create: {
      name: 'cashier',
      permissions: [
        'orders.create', 'orders.view', 'orders.edit', 'orders.discount',
        'tables.view',
        'cash.view', 'cash.manage',
        'crm.view',
      ],
    },
  });

  const waiterRole = await prisma.role.upsert({
    where: { name: 'waiter' },
    update: {},
    create: {
      name: 'waiter',
      permissions: [
        'orders.create', 'orders.view', 'orders.edit',
        'tables.view', 'tables.manage',
        'menu.view',
      ],
    },
  });

  const kitchenRole = await prisma.role.upsert({
    where: { name: 'kitchen' },
    update: {},
    create: {
      name: 'kitchen',
      permissions: ['kds.view', 'kds.update', 'orders.view'],
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: 'driver' },
    update: {},
    create: {
      name: 'driver',
      permissions: ['delivery.view', 'delivery.manage', 'orders.view'],
    },
  });

  // 2. Create branch
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      name: 'Restaurante Principal',
      address: 'Av. Corrientes 1234, CABA',
      phone: '+54 11 4567-8900',
      timezone: 'America/Argentina/Buenos_Aires',
      currency: 'ARS',
      settings: {
        taxRate: 21,
        receiptHeader: 'Restaurante Demo',
        receiptFooter: 'Gracias por su visita!',
      },
    },
  });

  // 3. Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@restaurante.com' },
    update: {},
    create: {
      email: 'admin@restaurante.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Sistema',
      pin: '0000',
      branches: {
        create: {
          branchId: branch.id,
          roleId: adminRole.id,
        },
      },
    },
  });

  // Create waiter user
  const waiterHash = await bcrypt.hash('waiter123', 10);
  const waiterUser = await prisma.user.upsert({
    where: { email: 'camarero@restaurante.com' },
    update: {},
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
    update: {},
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
    update: {},
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

  // Create superadmin user
  const superHash = await bcrypt.hash('super123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@restaurante.com' },
    update: {},
    create: {
      email: 'superadmin@restaurante.com',
      passwordHash: superHash,
      firstName: 'Super',
      lastName: 'Admin',
      pin: '9999',
      branches: {
        create: {
          branchId: branch.id,
          roleId: adminRole.id,
        },
      },
    },
  });

  // Create manager user
  const managerHash = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'gerente@restaurante.com' },
    update: {},
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

  // Create driver user
  const driverHash = await bcrypt.hash('driver123', 10);
  await prisma.user.upsert({
    where: { email: 'delivery@restaurante.com' },
    update: {},
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

  // Create second waiter
  const waiter2Hash = await bcrypt.hash('waiter123', 10);
  await prisma.user.upsert({
    where: { email: 'camarero2@restaurante.com' },
    update: {},
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
    data: { branchId: branch.id, name: 'Bebidas', sortOrder: 1 },
  });
  const entradas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Entradas', sortOrder: 2 },
  });
  const principales = await prisma.category.create({
    data: { branchId: branch.id, name: 'Platos Principales', sortOrder: 3 },
  });
  const pizzas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Pizzas', sortOrder: 4 },
  });
  const pastas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Pastas', sortOrder: 5 },
  });
  const sopas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Sopas y Cremas', sortOrder: 6 },
  });
  const hamburguesas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Hamburguesas', sortOrder: 7 },
  });
  const postres = await prisma.category.create({
    data: { branchId: branch.id, name: 'Postres', sortOrder: 8 },
  });

  // --- Bebidas ---
  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Vino Malbec Premium',
      kitchenStationId: barStation.id,
      description: 'Vino tinto reserva de Mendoza, notas de ciruela y vainilla.',
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
      prepTime: 15,
      variants: {
        create: [{ name: 'Individual', price: 4200, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
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

  console.log('=== SEED COMPLETADO CONÉXITO ===');
  console.log('');
  console.log('USUARIOS DEMO ACTUALIZADOS:');
  console.log('┌─────────────────────────────────┬──────────────┬──────┬────────────┐');
  console.log('│ Email                           │ Password     │ PIN  │ Rol        │');
  console.log('├─────────────────────────────────┼──────────────┼──────┼────────────┤');
  console.log('│ superadmin@restaurante.com       │ super123     │ 9999 │ admin      │');
  console.log('│ admin@restaurante.com            │ admin123     │ 0000 │ admin      │');
  console.log('│ gerente@restaurante.com          │ manager123   │ 4444 │ manager    │');
  console.log('│ cajero@restaurante.com           │ cajero123    │ 2222 │ cashier    │');
  console.log('│ camarero@restaurante.com         │ waiter123    │ 1111 │ waiter     │');
  console.log('│ cocina@restaurante.com           │ cocina123    │ 3333 │ kitchen    │');
  console.log('│ delivery@restaurante.com         │ driver123    │ 5555 │ driver     │');
  console.log('└─────────────────────────────────┴──────────────┴──────┴────────────┘');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
