const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('--- Verificando Sucursales ---');
    const branches = await prisma.branch.findMany({
        include: {
            _count: { select: { categories: true, products: true } }
        }
    });
    console.log(`Sucursales encontradas: ${branches.length}`);
    branches.forEach(b => {
        console.log(`- ${b.name} (ID: ${b.id}): Activo=${b.isActive}, Categorías=${b._count.categories}, Productos=${b._count.products}`);
    });

    console.log('\n--- Verificando Categorías Raíz ---');
    const rootCategories = await prisma.category.findMany({
        where: { parentId: null }
    });
    console.log(`Categorías raíz encontradas: ${rootCategories.length}`);
    rootCategories.forEach(c => {
        console.log(`- ${c.name} (Sucursal ID: ${c.branchId}) Activo=${c.isActive}`);
    });

    console.log('\n--- Verificando Productos ---');
    const products = await prisma.product.findMany({
        include: {
            branches: true
        }
    });
    console.log(`Productos encontrados: ${products.length}`);
    products.slice(0, 5).forEach(p => {
        console.log(`- ${p.name}: Activo=${p.isActive}, Sucursales vinculadas=${p.branches.length}`);
    });

    await prisma.$disconnect();
}

check();
