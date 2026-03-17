#!/bin/bash
set -e
echo "--- Prisma Generate ---"
npx prisma generate --schema=prisma/schema.prisma

echo "--- Compile NestJS API ---"
cd apps/api && npx tsc -p tsconfig.json && cd ../..

echo "--- Bundle API with esbuild ---"
npx esbuild apps/api/dist/vercel-entry.js \
  --bundle --platform=node --target=node20 --format=cjs \
  --outfile=api/nestjs-bundle.txt \
  --external:@prisma/client --external:.prisma/client \
  --external:@nestjs/microservices --external:@nestjs/websockets/socket-module \
  --external:cache-manager --external:class-transformer/storage \
  --external:bufferutil --external:utf-8-validate

echo "--- Build Frontend Apps ---"
node deploy-vercel.js

echo "--- Build Complete ---"
