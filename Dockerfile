# Build stage para dependencias comunes
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# ============================================================
# API Backend
# ============================================================
FROM base AS api-builder
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm install

COPY apps/api ./apps/api
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY turbo.json ./
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS api
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm install --production

COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]

# ============================================================
# POS Frontend
# ============================================================
FROM base AS pos-builder
COPY package*.json ./
COPY apps/pos/package*.json ./apps/pos/
COPY packages/ ./packages/
RUN npm install

COPY apps/pos ./apps/pos
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared
COPY tsconfig*.json ./
COPY turbo.json ./
RUN npm run build --workspace=apps/pos

FROM nginx:alpine AS pos
COPY --from=pos-builder /app/apps/pos/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# QR Menu Frontend
# ============================================================
FROM base AS qr-menu-builder
COPY package*.json ./
COPY apps/qr-menu/package*.json ./apps/qr-menu/
COPY packages/ ./packages/
RUN npm install

COPY apps/qr-menu ./apps/qr-menu
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared
COPY tsconfig*.json ./
COPY turbo.json ./
RUN npm run build --workspace=apps/qr-menu

FROM nginx:alpine AS qr-menu
COPY --from=qr-menu-builder /app/apps/qr-menu/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# Landing Page
# ============================================================
FROM base AS landing-page-builder
COPY package*.json ./
COPY apps/landing-page/package*.json ./apps/landing-page/
COPY packages/ ./packages/
RUN npm install

COPY apps/landing-page ./apps/landing-page
COPY packages/ui ./packages/ui
COPY packages/shared ./packages/shared
COPY tsconfig*.json ./
COPY turbo.json ./
RUN npm run build --workspace=apps/landing-page

FROM nginx:alpine AS landing-page
COPY --from=landing-page-builder /app/apps/landing-page/dist /usr/share/nginx/html
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# Imagen completa para producción (todas las apps)
# ============================================================
FROM base AS full-builder
COPY package*.json ./
COPY apps/*/package*.json ./apps/
COPY packages/*/package*.json ./packages/
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS full
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY apps/*/package*.json ./apps/
COPY packages/ ./packages/
RUN npm install --production

COPY --from=full-builder /app/apps/api/dist ./apps/api/dist
COPY --from=full-builder /app/apps/pos/dist ./apps/pos/dist
COPY --from=full-builder /app/apps/qr-menu/dist ./apps/qr-menu/dist
COPY --from=full-builder /app/apps/landing-page/dist ./apps/landing-page/dist
COPY --from=full-builder /app/prisma ./prisma

RUN npx prisma generate

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
