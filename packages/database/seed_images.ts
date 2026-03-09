import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const imageMap: Record<string, string[]> = {
    general: [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
    ],
    bebida: [
        'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80',
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
        'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
    ],
    pizza: [
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80',
        'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
    ],
    burger: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
        'https://images.unsplash.com/photo-1586816001966-79b736744398?w=500&q=80',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
    ],
    postre: [
        'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80',
        'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=500&q=80',
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80',
    ]
};

async function main() {
    const products = await prisma.product.findMany();
    console.log(`Poblando imágenes para ${products.length} productos...`);

    let updatedCount = 0;

    for (const product of products) {
        if (product.imageUrl && product.imageUrl.trim() !== '') {
            continue; // Skip if it already has an image
        }

        const nameLower = product.name.toLowerCase();

        let selectedCategory = 'general';
        if (nameLower.includes('pizza')) selectedCategory = 'pizza';
        else if (nameLower.includes('burger') || nameLower.includes('hamburguesa')) selectedCategory = 'burger';
        else if (nameLower.includes('coca') || nameLower.includes('agua') || nameLower.includes('limonada') || nameLower.includes('vino') || nameLower.includes('cerveza')) selectedCategory = 'bebida';
        else if (nameLower.includes('postre') || nameLower.includes('helado') || nameLower.includes('torta') || nameLower.includes('chocolate')) selectedCategory = 'postre';

        const options = imageMap[selectedCategory];
        const imageToUse = options[Math.floor(Math.random() * options.length)];

        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl: imageToUse }
        });

        updatedCount++;
        console.log(`Updated ${product.name} with ${selectedCategory} image`);
    }

    console.log(`Exito: ${updatedCount} productos actualizados con imágenes.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
