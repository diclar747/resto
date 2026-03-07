const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// --- Build Output API v3 ---
// Creates .vercel/output/ structure so Vercel uses our bundles directly (no ncc)

const OUTPUT = path.join(__dirname, '.vercel', 'output');
const STATIC = path.join(OUTPUT, 'static');
const FUNCTIONS = path.join(OUTPUT, 'functions');

// Clean previous output
if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT, { recursive: true });

// 1. Prisma
console.log('--- Prisma Generate ---');
run('npx prisma generate');

// 2. Compile & Bundle NestJS API
console.log('--- Compile NestJS API ---');
run('cd apps/api && npx tsc -p tsconfig.json');

console.log('--- Bundle API with esbuild ---');
const funcDir = path.join(FUNCTIONS, 'api.func');
fs.mkdirSync(funcDir, { recursive: true });

run([
  'npx esbuild apps/api/dist/vercel-entry.js',
  '--bundle --platform=node --target=node20 --format=cjs',
  `--outfile=${path.join(funcDir, 'index.js')}`,
  '--external:@prisma/client --external:.prisma/client',
  '--external:@nestjs/microservices --external:@nestjs/websockets/socket-module',
  '--external:cache-manager --external:class-transformer/storage',
  '--external:bufferutil --external:utf-8-validate',
].join(' '));

// Copy Prisma client into function
console.log('--- Copy Prisma Client ---');
copyDir(
  path.join(__dirname, 'node_modules', '.prisma'),
  path.join(funcDir, 'node_modules', '.prisma')
);
copyDir(
  path.join(__dirname, 'node_modules', '@prisma', 'client'),
  path.join(funcDir, 'node_modules', '@prisma', 'client')
);
// Copy prisma schema (needed by Prisma client at runtime)
copyDir(
  path.join(__dirname, 'prisma'),
  path.join(funcDir, 'prisma')
);

// Remove non-Linux engines and wasm files to reduce function size
console.log('--- Cleanup Prisma (remove non-Linux engines) ---');
const prismaClientDir = path.join(funcDir, 'node_modules', '.prisma', 'client');
for (const f of fs.readdirSync(prismaClientDir)) {
  if (
    (f.endsWith('.dll.node')) ||          // Windows engine
    (f.endsWith('.dylib.node')) ||         // macOS engine
    (f.includes('wasm')) ||                // Wasm files
    (f.includes('edge'))                   // Edge runtime files
  ) {
    fs.unlinkSync(path.join(prismaClientDir, f));
    console.log(`  Removed ${f}`);
  }
}
// Also clean @prisma/client engines
const prismaEnginesDir = path.join(funcDir, 'node_modules', '@prisma', 'client');
if (fs.existsSync(prismaEnginesDir)) {
  for (const f of fs.readdirSync(prismaEnginesDir)) {
    if (f.endsWith('.dll.node') || f.endsWith('.dylib.node')) {
      fs.unlinkSync(path.join(prismaEnginesDir, f));
      console.log(`  Removed @prisma/client/${f}`);
    }
  }
}

// Write .vc-config.json for the function
fs.writeFileSync(path.join(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
  memory: 1024,
  maxDuration: 30,
}, null, 2));

// 3. Build Frontend Apps
console.log('--- Build Landing Page ---');
run('npm run build -w apps/landing-page');
fs.mkdirSync(STATIC, { recursive: true });
copyDir(path.join(__dirname, 'apps', 'landing-page', 'dist'), STATIC);

console.log('--- Build POS ---');
run('npm run build -w apps/pos');
const posTarget = path.join(STATIC, 'pos');
fs.mkdirSync(posTarget, { recursive: true });
copyDir(path.join(__dirname, 'apps', 'pos', 'dist'), posTarget);

console.log('--- Build QR Menu ---');
run('npm run build -w apps/qr-menu');
const menuTarget = path.join(STATIC, 'menu');
fs.mkdirSync(menuTarget, { recursive: true });
copyDir(path.join(__dirname, 'apps', 'qr-menu', 'dist'), menuTarget);

// 4. Write config.json (routing)
console.log('--- Write config.json ---');
fs.writeFileSync(path.join(OUTPUT, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api' },
    { src: '/pos/(.*)', dest: '/pos/index.html' },
    { src: '/menu/(.*)', dest: '/menu/index.html' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));

console.log('--- Build Output API structure ready ---');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
