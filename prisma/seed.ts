import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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
  const hamburguesas = await prisma.category.create({
    data: { branchId: branch.id, name: 'Hamburguesas', sortOrder: 5 },
  });
  const postres = await prisma.category.create({
    data: { branchId: branch.id, name: 'Postres', sortOrder: 6 },
  });

  // Bebidas
  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Coca Cola',
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

  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Cerveza Quilmes',
      kitchenStationId: barStation.id,
      variants: {
        create: [
          { name: 'Pinta', price: 2000, isDefault: true },
          { name: 'Litro', price: 3500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: bebidas.id,
      name: 'Agua Mineral',
      kitchenStationId: barStation.id,
      variants: {
        create: [
          { name: 'Sin Gas', price: 1000, isDefault: true },
          { name: 'Con Gas', price: 1000 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // Entradas
  await prisma.product.create({
    data: {
      categoryId: entradas.id,
      name: 'Empanadas',
      kitchenStationId: grillStation.id,
      prepTime: 10,
      variants: {
        create: [
          { name: 'Carne', price: 800, isDefault: true },
          { name: 'Jamón y Queso', price: 800 },
          { name: 'Humita', price: 800 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: entradas.id,
      name: 'Provoleta',
      kitchenStationId: grillStation.id,
      prepTime: 8,
      variants: {
        create: [{ name: 'Estándar', price: 3500, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // Platos Principales
  await prisma.product.create({
    data: {
      categoryId: principales.id,
      name: 'Milanesa Napolitana',
      kitchenStationId: grillStation.id,
      prepTime: 15,
      variants: {
        create: [
          { name: 'Con Papas Fritas', price: 7500, isDefault: true },
          { name: 'Con Ensalada', price: 7500 },
          { name: 'Con Puré', price: 7500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: principales.id,
      name: 'Bife de Chorizo',
      kitchenStationId: grillStation.id,
      prepTime: 20,
      variants: {
        create: [
          { name: 'Con Papas Fritas', price: 9500, isDefault: true },
          { name: 'Con Ensalada', price: 9500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: principales.id,
      name: 'Ensalada César',
      kitchenStationId: coldStation.id,
      prepTime: 8,
      variants: {
        create: [
          { name: 'Estándar', price: 5000, isDefault: true },
          { name: 'Con Pollo', price: 6500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // Pizzas
  await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Muzzarella',
      kitchenStationId: grillStation.id,
      prepTime: 12,
      variants: {
        create: [
          { name: 'Grande', price: 6000, isDefault: true },
          { name: 'Individual', price: 3500 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: pizzas.id,
      name: 'Pizza Napolitana',
      kitchenStationId: grillStation.id,
      prepTime: 12,
      variants: {
        create: [
          { name: 'Grande', price: 7000, isDefault: true },
          { name: 'Individual', price: 4000 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // Hamburguesas
  const hamburguesa = await prisma.product.create({
    data: {
      categoryId: hamburguesas.id,
      name: 'Hamburguesa Clásica',
      kitchenStationId: grillStation.id,
      prepTime: 12,
      variants: {
        create: [
          { name: 'Simple', price: 5000, isDefault: true },
          { name: 'Doble', price: 7000 },
          { name: 'Triple', price: 9000 },
        ],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // Create modifier groups for hamburguesas
  const extrasGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Extras',
      minSelect: 0,
      maxSelect: 5,
      modifiers: {
        create: [
          { name: 'Queso Cheddar', priceAdjustment: 500, sortOrder: 1 },
          { name: 'Bacon', priceAdjustment: 700, sortOrder: 2 },
          { name: 'Huevo Frito', priceAdjustment: 400, sortOrder: 3 },
          { name: 'Extra Carne', priceAdjustment: 1500, sortOrder: 4 },
        ],
      },
      products: { create: { productId: hamburguesa.id } },
    },
  });

  const removeGroup = await prisma.modifierGroup.create({
    data: {
      name: 'Sin...',
      minSelect: 0,
      maxSelect: 5,
      modifiers: {
        create: [
          { name: 'Sin Cebolla', priceAdjustment: 0, sortOrder: 1 },
          { name: 'Sin Tomate', priceAdjustment: 0, sortOrder: 2 },
          { name: 'Sin Lechuga', priceAdjustment: 0, sortOrder: 3 },
          { name: 'Sin Salsa', priceAdjustment: 0, sortOrder: 4 },
        ],
      },
      products: { create: { productId: hamburguesa.id } },
    },
  });

  // Postres
  await prisma.product.create({
    data: {
      categoryId: postres.id,
      name: 'Flan con Dulce de Leche',
      kitchenStationId: dessertStation.id,
      prepTime: 3,
      variants: {
        create: [{ name: 'Estándar', price: 3000, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  await prisma.product.create({
    data: {
      categoryId: postres.id,
      name: 'Tiramisú',
      kitchenStationId: dessertStation.id,
      prepTime: 3,
      variants: {
        create: [{ name: 'Estándar', price: 3500, isDefault: true }],
      },
      branches: { create: { branchId: branch.id } },
    },
  });

  // 6. Create tables
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    const zone = i <= 6 ? 'Salón Principal' : i <= 9 ? 'Terraza' : 'Bar';
    const row = Math.floor((i - 1) / 3);
    const col = (i - 1) % 3;

    tables.push(
      prisma.table.create({
        data: {
          branchId: branch.id,
          number: i,
          name: `Mesa ${i}`,
          zone,
          capacity: i <= 6 ? 4 : i <= 9 ? 6 : 2,
          posX: col * 150 + 50,
          posY: row * 150 + 50,
          shape: i <= 9 ? 'square' : 'round',
          qrCode: `table-${branch.id}-${i}`,
        },
      }),
    );
  }
  await Promise.all(tables);

  // 7. Create sample ingredients
  const queso = await prisma.ingredient.create({
    data: { name: 'Queso Mozzarella', unit: 'kg', costPerUnit: 3000 },
  });
  const harina = await prisma.ingredient.create({
    data: { name: 'Harina', unit: 'kg', costPerUnit: 500 },
  });
  const tomate = await prisma.ingredient.create({
    data: { name: 'Salsa de Tomate', unit: 'kg', costPerUnit: 800 },
  });
  const carne = await prisma.ingredient.create({
    data: { name: 'Carne Molida', unit: 'kg', costPerUnit: 5000 },
  });
  const lechuga = await prisma.ingredient.create({
    data: { name: 'Lechuga', unit: 'kg', costPerUnit: 600 },
  });

  // Stock items
  await prisma.stockItem.createMany({
    data: [
      { branchId: branch.id, ingredientId: queso.id, currentStock: 20, minStock: 5 },
      { branchId: branch.id, ingredientId: harina.id, currentStock: 50, minStock: 10 },
      { branchId: branch.id, ingredientId: tomate.id, currentStock: 15, minStock: 3 },
      { branchId: branch.id, ingredientId: carne.id, currentStock: 30, minStock: 8 },
      { branchId: branch.id, ingredientId: lechuga.id, currentStock: 10, minStock: 2 },
    ],
  });

  // 8. Create a sample supplier
  await prisma.supplier.create({
    data: {
      name: 'Distribuidora Central',
      contactName: 'Juan Proveedor',
      email: 'contacto@distribuidoracentral.com',
      phone: '+54 11 5555-1234',
      branches: { create: { branchId: branch.id } },
    },
  });

  console.log('Seed completed!');
  console.log('');
  console.log('Users created:');
  console.log('  admin@restaurante.com / admin123 (PIN: 0000)');
  console.log('  camarero@restaurante.com / waiter123 (PIN: 1111)');
  console.log('  cajero@restaurante.com / cajero123 (PIN: 2222)');
  console.log('  cocina@restaurante.com / cocina123 (PIN: 3333)');
  console.log('');
  console.log('Branch: Restaurante Principal');
  console.log('Tables: 12 (6 salon, 3 terraza, 3 bar)');
  console.log('Products: 13 across 6 categories');
  console.log('Kitchen stations: Parrilla, Cocina Fría, Bar, Postres');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
