import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleMenus = [
    {
        categoryName: 'Pizzas Premium',
        imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=400',
        products: [
            { name: 'Margherita Clásica', description: 'Salsa pomodoro San Marzano, mozzarella fior di latte, albahaca fresca y aceite de oliva.', price: 12500, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
            { name: 'Pepperoni Artisan', description: 'Pepperoni curado picante, mozzarella, salsa de tomate y un toque de miel.', price: 14000, imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
            { name: 'Prosciutto y Rúcula', description: 'Jamón crudo italiano, queso parmesano en escamas, tomates secos y rúcula fresca.', price: 16500, imageUrl: 'https://images.unsplash.com/photo-1555072956-7758afb20e8f?w=400' }
        ]
    },
    {
        categoryName: 'Burgers Gourmet',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
        products: [
            { name: 'Bacon Cheeseburger', description: 'Medallón de 180g de asado, doble cheddar, bacon crujiente, cebolla crispy y salsa de la casa.', price: 9500, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
            { name: 'Veggie Truffled', description: 'Medallón de quinoa y portobellos, queso brie, rúcula, cebolla caramelizada y mayonesa trufada.', price: 10200, imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400' }
        ]
    },
    {
        categoryName: 'Postres',
        imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
        products: [
            { name: 'Tiramisú della Nonna', description: 'Receta tradicional italiana con mascarpone, café espresso y cacao amargo.', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400' },
            { name: 'Cheesecake de Frutos Rojos', description: 'Base de galleta crujiente, suave crema de queso y coulis de frutos del bosque.', price: 6200, imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400' }
        ]
    }
];

async function seed() {
    console.log('Fetching active branches...');
    const branches = await prisma.branch.findMany({ where: { isActive: true } });

    console.log(`Found ${branches.length} active branches.`);

    for (const branch of branches) {
        const categoriesCount = await prisma.category.count({ where: { branchId: branch.id } });

        if (categoriesCount > 0) {
            console.log(`Branch ${branch.name} already has menus. Skipping...`);
            continue;
        }

        console.log(`Seeding demo menu for ${branch.name}...`);

        for (const [index, catData] of sampleMenus.entries()) {
            const category = await prisma.category.create({
                data: {
                    branchId: branch.id,
                    name: catData.categoryName,
                    imageUrl: catData.imageUrl,
                    sortOrder: index,
                }
            });

            for (const [pIndex, productData] of catData.products.entries()) {
                const product = await prisma.product.create({
                    data: {
                        categoryId: category.id,
                        name: productData.name,
                        description: productData.description,
                        imageUrl: productData.imageUrl,
                        sortOrder: pIndex,
                        variants: {
                            create: {
                                name: 'Standard',
                                price: productData.price,
                                isDefault: true,
                            }
                        },
                        branches: {
                            create: {
                                branchId: branch.id
                            }
                        }
                    }
                });
            }
        }
    }

    console.log('Seeding finished!');
}

seed()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
