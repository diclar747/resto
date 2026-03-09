import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Marketplace Stores...');

    const stores = [
        {
            name: 'Gourmet Burgers',
            address: 'Av. Corrientes 1234, CABA',
            phone: '+5491123456789',
            whatsapp: '+5491123456789',
            bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80',
            settings: {
                headerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80',
                logoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
                description: 'Las mejores hamburguesas gourmet, hechas con blends de carne seleccionada y pan artesanal.',
            },
            categories: ['Burgers', 'Todos']
        },
        {
            name: 'Artisan Pizza',
            address: 'Palermo Soho 456, CABA',
            phone: '+5491198765432',
            whatsapp: '+5491198765432',
            bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
            settings: {
                headerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80',
                logoUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&q=80',
                description: 'Pizza de autor al horno de leña, masa madre de 48 horas de fermentación e ingredientes D.O.P.',
            },
            categories: ['Pizza', 'Todos']
        },
        {
            name: 'Healthy Bowls & Salads',
            address: 'Belgrano 789, CABA',
            phone: '+5491155554444',
            whatsapp: '+5491155554444',
            bannerUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
            settings: {
                headerUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
                logoUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80',
                description: 'Bowls nutricionales, ensaladas frescas y opciones veganas llenas de energía para tu día agitado.',
            },
            categories: ['Salads', 'Café', 'Todos']
        }
    ];

    for (const store of stores) {
        // 1. Create the Branch
        const branch = await prisma.branch.create({
            data: {
                name: store.name,
                address: store.address,
                phone: store.phone,
                whatsapp: store.whatsapp,
                bannerUrl: store.bannerUrl,
                settings: store.settings,
            }
        });

        console.log(`Created Store: ${store.name} with ID: ${branch.id}`);

        // 2. Add some mock reviews to get an average rating
        const reviewRatings = [5, 4, 5, 5, 4]; // avg 4.6
        for (const [index, rating] of reviewRatings.entries()) {
            await prisma.branchReview.create({
                data: {
                    branchId: branch.id,
                    userName: `Cliente Satisfecho ${index + 1}`,
                    rating: rating,
                    comment: '¡Excelente atención y sabores increíbles! Altamente recomendado.',
                }
            });
        }

        // 3. Instead of categories, we need to map the labels in the Marketplace UI
        // The UI uses a mock array in `filteredBranches`: `b.categories.some(c => c.name.includes(activeCategory))`
        for (const catName of store.categories) {
            await prisma.category.create({
                data: {
                    branchId: branch.id,
                    name: catName,
                    isActive: true
                }
            });
        }
    }

    console.log('Successfully added 3 Marketplace branches!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
