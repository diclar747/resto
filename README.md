# 🍽️ Sistema de Gestión para Restaurantes

Un sistema completo de gestión para restaurantes con múltiples sucursales, incluyendo POS, menú QR, KDS (Kitchen Display System), y más.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Seguridad](#seguridad)
- [Contribución](#contribución)
- [Licencia](#licencia)

## ✨ Características

### Multi-Sucursal
- Gestión de múltiples sucursales con configuraciones independientes
- Timezone y moneda por sucursal
- Traspasos de stock entre sucursales

### Punto de Venta (POS)
- Interfaz rápida y responsive
- Gestión de mesas y comandas
- Cobros y cierre de caja
- Historial de transacciones

### Menú QR
- Menú digital accesible vía QR
- Pedidos desde la mesa
- Carrito de compras
- Integración con WhatsApp

### Kitchen Display System (KDS)
- Pantallas para cocina
- Gestión de estados de pedidos
- Tiempos de preparación
- Priorización de órdenes

### Delivery
- Gestión de repartidores
- Seguimiento de entregas
- Zonas de reparto
- Integración con mapas

### Inventario
- Control de stock en tiempo real
- Alertas de stock bajo
- Recetas y escandallos
- Proveedores y compras

### Reportes
- Ventas por período
- Productos más vendidos
- Rendimiento por empleado
- Análisis financiero

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│     POS     │   QR Menu    │  Landing     │      KDS        │
│  (React)    │   (React)    │  (React)     │    (React)      │
└──────┬──────┴──────┬───────┴──────┬───────┴────────┬────────┘
       │             │              │                │
       └─────────────┴──────────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Gateway                          │
│                    (NestJS + Express)                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│  PostgreSQL │      │    Redis    │      │  File Storage   │
│  Database   │      │   Cache     │      │  (S3/Local)     │
└─────────────┘      └─────────────┘      └─────────────────┘
```

## 📦 Requisitos Previos

### Software Requerido
- **Node.js**: v18.x o superior
- **npm**: v10.x o superior
- **PostgreSQL**: v14.x o superior
- **Redis**: v6.x o superior (opcional pero recomendado)

### Herramientas de Desarrollo
- Git
- Docker (opcional, para contenedores)
- Prisma CLI

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/restaurante.git
cd restaurante
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/restaurante"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="tu-secreto-seguro-de-al-menos-32-caracteres"
JWT_REFRESH_SECRET="otro-secreto-diferente-para-refresh-tokens"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Puerto del Servidor
PORT=3000

# Almacenamiento de Archivos (opcional)
STORAGE_PROVIDER=local
# STORAGE_PROVIDER=s3
# AWS_ACCESS_KEY_ID=tu-key
# AWS_SECRET_ACCESS_KEY=tu-secret
# AWS_BUCKET=tu-bucket
# AWS_REGION=us-east-1

# Notificaciones (opcional)
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# URLs de Frontend
FRONTEND_POS_URL=http://localhost:3001
FRONTEND_QR_URL=http://localhost:3002
FRONTEND_LANDING_URL=http://localhost:3003
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones
npm run db:migrate

# Seed inicial (datos de prueba)
npm run db:seed
```

### 5. Iniciar Servidores de Desarrollo

```bash
# Todas las aplicaciones
npm run dev

# Solo API
npm run dev:api

# Solo POS
npm run dev:pos

# Solo Menú QR
npm run dev:qr
```

Accede a las aplicaciones:
- **POS**: http://localhost:3001
- **Menú QR**: http://localhost:3002
- **Landing Page**: http://localhost:3003
- **API**: http://localhost:3000

## ⚙️ Configuración

### Usuario por Defecto (Seed)

Después de ejecutar el seed, puedes acceder con:

```
Email: admin@restaurante.com
Password: admin123
```

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente en producción.

### Configuración de Producción

1. **Variables de Entorno Seguras**
   - Usa secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Nunca commitees `.env` al repositorio

2. **Base de Datos**
   - Usa conexiones SSL
   - Configura pool de conexiones apropiado
   - Realiza backups automáticos

3. **Redis**
   - Requiere autenticación
   - Usa conexión SSL en producción

## 🏃 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Todas las apps
npm run dev:api          # Solo API
npm run dev:pos          # Solo POS
npm run dev:qr           # Solo Menú QR

# Build
npm run build            # Todas las apps
npm run build:api        # Solo API
npm run build:pos        # Solo POS
npm run build:qr         # Solo Menú QR

# Base de Datos
npm run db:migrate       # Migraciones
npm run db:seed          # Seed data
npm run db:studio        # Prisma Studio GUI

# Calidad de Código
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Tests
npm run test:coverage    # Tests con coverage
```

### Hot Reload

Todas las aplicaciones soportan hot reload en desarrollo. Los cambios se reflejan automáticamente.

## 🚀 Producción

### Build de Producción

```bash
npm run build
```

### Deploy con Docker

```bash
docker-compose up -d
```

### Deploy en Vercel

El proyecto está configurado para deploy en Vercel:

```bash
npm run deploy:vercel
```

### Consideraciones de Producción

1. **HTTPS**: Forzar HTTPS en todos los entornos de producción
2. **CORS**: Configurar orígenes permitidos específicamente
3. **Rate Limiting**: Implementar límites de peticiones
4. **Logging**: Usar logs estructurados
5. **Monitoreo**: Configurar health checks y métricas

## 📁 Estructura del Proyecto

```
restaurante/
├── apps/                      # Aplicaciones principales
│   ├── api/                   # API NestJS
│   │   ├── src/
│   │   │   ├── modules/       # Módulos de negocio
│   │   │   ├── common/        # Utilidades compartidas
│   │   │   └── main.ts
│   │   └── package.json
│   ├── pos/                   # App POS (React + Vite)
│   ├── qr-menu/               # Menú QR (React + Vite)
│   └── landing-page/          # Landing page (React + Vite)
├── packages/                  # Paquetes compartidos
│   ├── database/              # Configuración de DB
│   ├── shared/                # Tipos y utilidades
│   └── ui/                    # Componentes UI
├── prisma/                    # Schema y migraciones
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── .env.example               # Variables de entorno ejemplo
├── docker-compose.yml         # Docker Compose
├── package.json               # Root package.json
└── README.md                  # Este archivo
```

## 📖 API Documentation

La API sigue principios RESTful. Para ver la documentación completa:

```bash
# En desarrollo, accede a:
http://localhost:3000/api/docs
```

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Login con email/password
- `POST /api/auth/pin-login` - Login con PIN
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

#### Usuarios
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `GET /api/users/:id` - Obtener usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

#### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/products/:id` - Obtener producto
- `PATCH /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

#### Órdenes
- `GET /api/orders` - Listar órdenes
- `POST /api/orders` - Crear orden
- `PATCH /api/orders/:id/status` - Actualizar estado
- `GET /api/orders/:id` - Obtear orden detallada

### Autenticación

La API usa JWT tokens. Incluye el token en el header:

```
Authorization: Bearer <tu-token-jwt>
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm run test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Con coverage
npm run test:coverage
```

### Escribir Tests

Los tests están ubicados junto al código que prueban:

```
src/
├── module/
│   ├── module.service.ts
│   ├── module.service.spec.ts    # Test unitario
│   ├── module.controller.ts
│   └── module.controller.spec.ts # Test del controller
```

## 🔒 Seguridad

### Mejores Prácticas Implementadas

1. **Autenticación**
   - JWT con refresh tokens
   - Passwords hasheados con bcrypt
   - PIN de acceso opcional

2. **Autorización**
   - Roles y permisos granulares
   - Guards para protección de rutas
   - Validación a nivel de servicio

3. **Validación de Input**
   - DTOs con class-validator
   - Sanitización de inputs
   - Prevención de SQL injection (Prisma ORM)

4. **Seguridad HTTP**
   - Headers de seguridad
   - CORS configurado
   - Rate limiting

### Recomendaciones Adicionales

- Rotar secrets regularmente
- Implementar 2FA para usuarios admin
- Auditar logs de acceso
- Actualizar dependencias regularmente

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

### Convenciones de Código

- **Commits**: Sigue [Conventional Commits](https://www.conventionalcommits.org/)
- **TypeScript**: Usa tipos estrictos
- **Estilo**: Sigue la configuración de ESLint y Prettier

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte, abre un issue en GitHub o contacta al equipo de desarrollo.

---

**Hecho con ❤️ para la industria gastronómica**
