const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Creando/Actualizando usuarios POS y Clientes Demo...');

    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } }) || await prisma.role.findFirst();
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'superadmin' } }) || adminRole;
    const managerRole = await prisma.role.findUnique({ where: { name: 'manager' } }) || adminRole;
    const cashierRole = await prisma.role.findUnique({ where: { name: 'cashier' } }) || adminRole;
    const waiterRole = await prisma.role.findUnique({ where: { name: 'waiter' } }) || adminRole;
    const kitchenRole = await prisma.role.findUnique({ where: { name: 'kitchen' } }) || adminRole;
    const driverRole = await prisma.role.findUnique({ where: { name: 'driver' } }) || adminRole;

    const branch = await prisma.branch.findFirst();
    if (!branch) {
        console.error('No se encontró ninguna sucursal.');
        return;
    }

    const usersToCreate = [
        { email: 'superadmin@restaurante.com', pass: 'super123', pin: '9999', first: 'Super', last: 'Admin', role: superAdminRole },
        { email: 'admin@restaurante.com', pass: 'admin123', pin: '0000', first: 'Admin', last: 'Sistema', role: adminRole },
        { email: 'gerente@restaurante.com', pass: 'manager123', pin: '4444', first: 'Gerente', last: 'Regional', role: managerRole },
        { email: 'cajero@restaurante.com', pass: 'cajero123', pin: '2222', first: 'Cajero', last: 'Principal', role: cashierRole },
        { email: 'camarero@restaurante.com', pass: 'waiter123', pin: '1111', first: 'Camarero', last: 'Uno', role: waiterRole },
        { email: 'camarero2@restaurante.com', pass: 'waiter123', pin: '6666', first: 'Camarero', last: 'Dos', role: waiterRole },
        { email: 'cocina@restaurante.com', pass: 'cocina123', pin: '3333', first: 'Jefe', last: 'Cocina', role: kitchenRole },
        { email: 'delivery@restaurante.com', pass: 'driver123', pin: '5555', first: 'Repartidor', last: 'Express', role: driverRole },
        // Demo users with PIN as requested
        { email: 'demo1@restaurante.com', pass: 'demo123', pin: '7777', first: 'Demo', last: 'User 1', role: waiterRole },
        { email: 'demo2@restaurante.com', pass: 'demo123', pin: '8888', first: 'Demo', last: 'User 2', role: waiterRole },
    ];

    for (const u of usersToCreate) {
        const hash = await bcrypt.hash(u.pass, 10);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                passwordHash: hash,
                pin: u.pin,
                firstName: u.first,
                lastName: u.last
            },
            create: {
                email: u.email,
                passwordHash: hash,
                pin: u.pin,
                firstName: u.first,
                lastName: u.last,
                branches: {
                    create: {
                        branchId: branch.id,
                        roleId: u.role.id,
                    }
                }
            }
        });
        console.log(`Usuario Creado/Actualizado: ${u.email} (PIN: ${u.pin})`);
    }

    // Create 2 Marketplace Clients
    const clientsToCreate = [
        { email: 'cliente1@restaurante.com', pass: 'cliente123', first: 'Cliente', last: 'Demo 1' },
        { email: 'cliente2@restaurante.com', pass: 'cliente123', first: 'Cliente', last: 'Demo 2' },
    ];

    for (const c of clientsToCreate) {
        const hash = await bcrypt.hash(c.pass, 10);
        await prisma.client.upsert({
            where: { email: c.email },
            update: {
                passwordHash: hash,
                firstName: c.first,
                lastName: c.last
            },
            create: {
                email: c.email,
                passwordHash: hash,
                firstName: c.first,
                lastName: c.last,
                phone: `+595999000${Math.floor(Math.random() * 999)}`
            }
        });
        console.log(`Cliente Marketplace Creado: ${c.email}`);
    }

    console.log('✅ Usuarios listos.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
