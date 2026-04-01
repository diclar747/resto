const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetClients() {
  console.log('=== RECREANDO CLIENTES CON PINs ===\n');
  
  const clients = [
    { firstName: 'Juan', lastName: 'Pérez', email: 'juan@gmail.com', phone: '+595981111111', pin: '1234' },
    { firstName: 'María', lastName: 'González', email: 'maria@gmail.com', phone: '+595982222222', pin: '5678' },
    { firstName: 'Carlos', lastName: 'López', email: 'carlos@gmail.com', phone: '+595983333333', pin: '4321' },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana@gmail.com', phone: '+595984444444', pin: '8765' },
    { firstName: 'Roberto', lastName: 'Fernández', email: 'roberto@gmail.com', phone: '+595985555555', pin: '1122' },
  ];

  for (const c of clients) {
    const hash = await bcrypt.hash('cliente123', 10);
    await prisma.client.upsert({
      where: { email: c.email },
      update: { 
        pin: c.pin,
        isActive: true,
        passwordHash: hash
      },
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        passwordHash: hash,
        pin: c.pin,
        isActive: true
      }
    });
    console.log(`✅ Cliente ${c.firstName} ${c.lastName} - PIN: ${c.pin}`);
  }
  
  console.log('\n=== CLIENTES RECREADOS EXITOSAMENTE ===');
  console.log('\nPINs válidos:');
  console.log('  1234 - Juan Pérez');
  console.log('  5678 - María González');
  console.log('  4321 - Carlos López');
  console.log('  8765 - Ana Martínez');
  console.log('  1122 - Roberto Fernández');
  console.log('\nContraseña para todos: cliente123');
  
  await prisma.$disconnect();
}

resetClients().catch(console.error);
