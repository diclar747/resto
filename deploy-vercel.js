const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle NestJS API with esbuild into a .txt file (ncc won't process .txt as JS)
console.log('--- Bundle API with esbuild ---');
execSync([
    'npx esbuild apps/api/dist/vercel-entry.js',
    '--bundle --platform=node --target=node20 --format=cjs',
    '--outfile=api/nestjs-bundle.txt',
    '--external:@prisma/client --external:.prisma/client',
    '--external:@nestjs/microservices --external:@nestjs/websockets/socket-module',
    '--external:cache-manager --external:class-transformer/storage',
    '--external:bufferutil --external:utf-8-validate',
].join(' '), { stdio: 'inherit' });

// Copy Prisma client into api/ dir so it's available at runtime
console.log('--- Copy Prisma Client into api/ ---');
const apiDir = path.join(__dirname, 'api');
copyDir(
    path.join(__dirname, 'node_modules', '.prisma'),
    path.join(apiDir, 'node_modules', '.prisma')
);
copyDir(
    path.join(__dirname, 'node_modules', '@prisma', 'client'),
    path.join(apiDir, 'node_modules', '@prisma', 'client')
);
// Copy prisma schema (needed by Prisma client at runtime)
copyDir(
    path.join(__dirname, 'prisma'),
    path.join(apiDir, 'prisma')
);
// Remove non-Linux engines to reduce size
const pcDir = path.join(apiDir, 'node_modules', '.prisma', 'client');
if (fs.existsSync(pcDir)) {
    for (const f of fs.readdirSync(pcDir)) {
        if (f.endsWith('.dll.node') || f.endsWith('.dylib.node') || f.includes('wasm') || f.includes('edge')) {
            fs.unlinkSync(path.join(pcDir, f));
            console.log(`  Removed ${f}`);
        }
    }
}

// Ensure root dist exists
const rootDist = path.join(__dirname, 'dist');
if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
}
fs.mkdirSync(rootDist);

console.log('--- Building Apps ---');

// Build Landing Page (Root)
console.log('Building Landing Page...');
execSync('npm run build -w apps/landing-page', { stdio: 'inherit' });
const landingDist = path.join(__dirname, 'apps/landing-page/dist');
copyDir(landingDist, rootDist);

// Build POS (/pos)
console.log('Building POS...');
execSync('npm run build -w apps/pos', { stdio: 'inherit' });
const posDist = path.join(__dirname, 'apps/pos/dist');
const targetPos = path.join(rootDist, 'pos');
fs.mkdirSync(targetPos);
copyDir(posDist, targetPos);

// Build QR Menu (/menu)
console.log('Building QR Menu...');
execSync('npm run build -w apps/qr-menu', { stdio: 'inherit' });
const qrDist = path.join(__dirname, 'apps/qr-menu/dist');
const targetQr = path.join(rootDist, 'menu');
fs.mkdirSync(targetQr);
copyDir(qrDist, targetQr);

console.log('--- Deployment Structure Ready ---');

function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
