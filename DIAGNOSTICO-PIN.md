# Diagnóstico de Login por PIN - Marketplace

## Problema
El endpoint `/api/marketplace/auth/login-pin` devuelve "PIN inválido" para todos los PINs.

## Causa probable
La base de datos en producción NO tiene los PINs configurados para los clientes.

## Pasos para diagnosticar

### 1. Verificar el endpoint de diagnóstico
Abre en el navegador o usa curl:
```
https://TU-DOMINIO.vercel.app/api/marketplace/auth/debug-pins
```

Esto mostrará:
- Total de clientes en la BD
- Cuántos tienen PIN configurado
- Lista de clientes (con PINs parcialmente ocultos)

### 2. Si no hay clientes con PIN:

Ejecuta este script para recrear los clientes con PINs:

```javascript
// reset-marketplace-clients.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetClients() {
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
      update: { pin: c.pin },
      create: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        passwordHash: hash,
        pin: c.pin,
      }
    });
    console.log(`✅ Cliente ${c.firstName} - PIN: ${c.pin}`);
  }
  
  console.log('\n✅ Clientes recreados exitosamente');
  await prisma.$disconnect();
}

resetClients().catch(console.error);
```

Ejecutar:
```bash
node reset-marketplace-clients.js
```

### 3. PINs válidos para testing

| PIN | Cliente |
|-----|---------|
| 1234 | Juan Pérez |
| 5678 | María González |
| 4321 | Carlos López |
| 8765 | Ana Martínez |
| 1122 | Roberto Fernández |

Contraseña para login email: `cliente123`

### 4. Si sigue sin funcionar

Verifica los logs de Vercel:
```bash
vercel logs --all
```

Busca mensajes como:
- "Body recibido en login-pin"
- "Buscando cliente con PIN"
- "Cliente no encontrado con PIN"

## Cambios realizados

1. ✅ Agregado logging detallado en el servidor
2. ✅ Agregado endpoint de diagnóstico `/marketplace/auth/debug-pins`
3. ✅ Mejorado manejo de errores
4. ✅ Validación de tipos de datos

## Commit
`cf5b08b` - fix: agregado endpoint de diagnóstico y mejor logging para login por PIN
