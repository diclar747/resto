const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    console.log('--- Verificando Usuarios y Sucursales ---');
    const users = await prisma.user.findMany({
        include: {
            branches: {
                include: { branch: true, role: true }
            }
        }
    });

    users.forEach(u => {
        console.log(`Usuario: ${u.email} (PIN: ${u.pin})`);
        if (u.branches.length === 0) {
            console.log('  [!] Sin sucursales asignadas');
        } else {
            u.branches.forEach(ub => {
                console.log(`  - Sucursal: ${ub.branch.name} (ID: ${ub.branchId}), Rol: ${ub.role.name}`);
            });
        }
    });

    await prisma.$disconnect();
}

checkUsers();
