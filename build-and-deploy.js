#!/usr/bin/env node
/**
 * Script completo para build y preparar para deploy
 * Uso: node build-and-deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== BUILD AND DEPLOY ===\n');

// 1. Limpiar builds anteriores
console.log('1. Limpiando builds anteriores...');
try {
    if (fs.existsSync('apps/api/dist')) {
        fs.rmSync('apps/api/dist', { recursive: true, force: true });
        console.log('   ✅ apps/api/dist eliminado');
    }
    if (fs.existsSync('api/nestjs-bundle.txt')) {
        fs.rmSync('api/nestjs-bundle.txt', { force: true });
        console.log('   ✅ api/nestjs-bundle.txt eliminado');
    }
} catch (e) {
    console.log('   ⚠️  Error limpiando:', e.message);
}

// 2. Generar Prisma Client
console.log('\n2. Generando Prisma Client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('   ✅ Prisma Client generado');
} catch (e) {
    console.error('   ❌ Error generando Prisma:', e.message);
    process.exit(1);
}

// 3. Compilar TypeScript
console.log('\n3. Compilando TypeScript...');
try {
    execSync('npx tsc -p apps/api/tsconfig.json', { stdio: 'inherit' });
    console.log('   ✅ TypeScript compilado');
} catch (e) {
    console.error('   ❌ Error compilando TypeScript:', e.message);
    process.exit(1);
}

// 4. Ejecutar deploy-vercel.js
console.log('\n4. Ejecutando deploy-vercel.js...');
try {
    execSync('node deploy-vercel.js', { stdio: 'inherit' });
    console.log('   ✅ Build completado');
} catch (e) {
    console.error('   ❌ Error en deploy-vercel:', e.message);
    process.exit(1);
}

console.log('\n=== ✅ BUILD COMPLETADO ===');
console.log('\nPara subir a Vercel, ejecuta:');
console.log('  vercel --force');
console.log('\nO haz commit y push:');
console.log('  git add -A');
console.log('  git commit -m "build: update bundle"');
console.log('  git push origin main');
