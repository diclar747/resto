
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Image URLs Diagnostic ---');

    try {
        const branches = await prisma.branch.findMany({
            select: { id: true, name: true, bannerUrl: true, settings: true }
        });
        console.log('\nBranches:');
        console.table(branches.map(b => ({
            name: b.name,
            banner: b.bannerUrl ? 'Yes' : 'No',
            logo: (b.settings && b.settings.logoUrl) ? 'Yes' : 'No',
            header: (b.settings && b.settings.headerUrl) ? 'Yes' : 'No'
        })));

        const categories = await prisma.category.findMany({
            select: { id: true, name: true, imageUrl: true },
            take: 10
        });
        console.log('\nCategories (Top 10):');
        console.table(categories.map(c => ({
            name: c.name,
            image: c.imageUrl ? 'Yes' : 'No'
        })));

        const products = await prisma.product.findMany({
            select: { id: true, name: true, imageUrl: true },
            where: { imageUrl: { not: null } },
            take: 10
        });
        console.log('\nProducts with images (Top 10):');
        console.table(products.map(p => ({
            name: p.name,
            image: p.imageUrl ? 'Yes' : 'No'
        })));
    } catch (err) {
        console.error('Error querying database:', err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
