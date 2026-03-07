const { execSync } = require('child_process');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

console.log('--- Prisma Generate ---');
run('npx prisma generate');

console.log('--- Compile NestJS API ---');
run('cd apps/api && npx tsc -p tsconfig.json');

console.log('--- Bundle API with esbuild ---');
run([
  'npx esbuild apps/api/dist/vercel-entry.js',
  '--bundle --platform=node --target=node20 --format=cjs',
  '--outfile=api/index.js',
  '--external:@prisma/client --external:.prisma/client',
  '--external:@nestjs/microservices --external:@nestjs/websockets/socket-module',
  '--external:cache-manager --external:class-transformer/storage',
  '--external:bufferutil --external:utf-8-validate',
].join(' '));

console.log('--- Build Frontend Apps ---');
run('node deploy-vercel.js');

console.log('--- Build Complete ---');
