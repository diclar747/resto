# 🔧 TROUBLESHOOTING - Login PIN Marketplace

## Problema: "PIN inválido" para todos los PINs

## Causas posibles y soluciones

### 1. 🚨 LA BASE DE DATOS NO TIENE LOS CLIENTES CON PIN

**Verificar:**
Abre en navegador:
```
https://TU-DOMINIO.vercel.app/api/marketplace/auth/debug-pins
```

**Si muestra:**
- `"clientsWithPin": 0` → La BD no tiene PINs
- `"totalClients": 0` → No hay clientes en la BD

**Solución:**
Ejecuta en tu base de datos de producción:

```bash
# Usando Prisma Studio
npx prisma studio

# O ejecuta el script
node reset-marketplace-clients.js
```

### 2. 🚨 EL BUNDLE NO ESTÁ ACTUALIZADO

El archivo `api/nestjs-bundle.txt` puede ser viejo.

**Solución - Redeploy:**
```bash
# 1. Forzar nuevo build en Vercel
vercel --force

# O en el dashboard de Vercel:
# 1. Ve a tu proyecto
# 2. Settings → Git
# 3. "Redeploy" el último commit
```

### 3. 🚨 VERIFICAR QUE LA API RESPONDE

Prueba estos endpoints:

**Test básico:**
```bash
curl https://TU-DOMINIO.vercel.app/api/marketplace/auth/debug-pins
```

**Test login:**
```bash
curl -X POST https://TU-DOMINIO.vercel.app/api/marketplace/auth/login-pin \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'
```

### 4. 🚨 VERIFICAR LOGS DE VERCEL

```bash
vercel logs --all
```

Busca:
- "Body recibido en login-pin"
- "Buscando cliente con PIN"

## PINs válidos para testing

| PIN | Cliente |
|-----|---------|
| 1234 | Juan Pérez |
| 5678 | María González |
| 4321 | Carlos López |
| 8765 | Ana Martínez |
| 1122 | Roberto Fernández |

Contraseña para login email: `cliente123`

## Si nada funciona - Solución nuclear 💣

### Paso 1: Resetear base de datos completa
```bash
npx prisma migrate reset --force
npx prisma db seed
node seed-extra-users.js
node reset-marketplace-clients.js
```

### Paso 2: Forzar redeploy limpio
```bash
# Limpiar todo
git rm -r --cached api/nestjs-bundle.txt
git commit -m "chore: limpiar bundle viejo"
git push

# El build de Vercel recreará el bundle
```

### Paso 3: Verificar Variables de Entorno en Vercel
En el dashboard de Vercel, verifica:
- `DATABASE_URL` - Debe apuntar a tu BD
- `JWT_SECRET` - Debe estar configurado
- `JWT_REFRESH_SECRET` - Debe estar configurado

## Scripts de diagnóstico

**Verificar clientes:**
```javascript
// check-clients.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const clients = await prisma.client.findMany();
  console.log('Total clientes:', clients.length);
  clients.forEach(c => {
    console.log(`- ${c.firstName}: PIN=${c.pin}, Activo=${c.isActive}`);
  });
  await prisma.$disconnect();
}
check();
```

Ejecutar:
```bash
node check-clients.js
```

## Contacto

Si sigue sin funcionar después de todo esto, revisa los logs de Vercel y comparte:
1. Output de `/api/marketplace/auth/debug-pins`
2. Logs del servidor
3. Screenshot del error
