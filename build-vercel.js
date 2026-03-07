const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// 1. Prisma
console.log('--- Prisma Generate ---');
run('npx prisma generate');

// 2. Compile & Bundle NestJS API into a single api/index.js
console.log('--- Compile NestJS API ---');
run('cd apps/api && npx tsc -p tsconfig.json');

console.log('--- Bundle API with esbuild ---');
// Bundle to .txt so Vercel ncc doesn't try to parse it as JS
run([
  'npx esbuild apps/api/dist/vercel-entry.js',
  '--bundle --platform=node --target=node20 --format=cjs',
  '--outfile=api/nestjs-bundle.txt',
  '--external:@prisma/client --external:.prisma/client',
  '--external:@nestjs/microservices --external:@nestjs/websockets/socket-module',
  '--external:cache-manager --external:class-transformer/storage',
  '--external:bufferutil --external:utf-8-validate',
].join(' '));

// 3. Build Frontend Apps into dist/
console.log('--- Build Frontend Apps ---');
const rootDist = path.join(__dirname, 'dist');
if (fs.existsSync(rootDist)) fs.rmSync(rootDist, { recursive: true, force: true });
fs.mkdirSync(rootDist);

console.log('Building Landing Page...');
run('npm run build -w apps/landing-page');
copyDir(path.join(__dirname, 'apps/landing-page/dist'), rootDist);

console.log('Building POS...');
run('npm run build -w apps/pos');
const posTarget = path.join(rootDist, 'pos');
fs.mkdirSync(posTarget);
copyDir(path.join(__dirname, 'apps/pos/dist'), posTarget);

console.log('Building QR Menu...');
run('npm run build -w apps/qr-menu');
const menuTarget = path.join(rootDist, 'menu');
fs.mkdirSync(menuTarget);
copyDir(path.join(__dirname, 'apps/qr-menu/dist'), menuTarget);

console.log('--- Build Complete ---');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
