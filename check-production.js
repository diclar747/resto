#!/usr/bin/env node
/**
 * Script para verificar el estado de la API en producción
 * Uso: node check-production.js https://tu-dominio.vercel.app
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.argv[2] || process.env.API_URL;

if (!BASE_URL) {
  console.log('❌ Error: Debes proporcionar la URL de la API');
  console.log('Uso: node check-production.js https://tu-dominio.vercel.app');
  process.exit(1);
}

console.log('=== VERIFICACIÓN DE API EN PRODUCCIÓN ===\n');
console.log('URL:', BASE_URL);
console.log('');

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runChecks() {
  // 1. Health check
  console.log('1️⃣  Health Check...');
  try {
    const res = await request('/api/marketplace/auth/health');
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(res.body));
    console.log('   ✅ API responde\n');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }

  // 2. Debug pins
  console.log('2️⃣  Verificando clientes con PIN...');
  try {
    const res = await request('/api/marketplace/auth/debug-pins');
    console.log('   Status:', res.status);
    if (res.body.totalClients !== undefined) {
      console.log('   Total clientes:', res.body.totalClients);
      console.log('   Clientes con PIN:', res.body.clientsWithPin);
      if (res.body.clientsWithPin === 0) {
        console.log('   ⚠️  NO HAY CLIENTES CON PIN - Ejecuta: node reset-marketplace-clients.js');
      } else {
        console.log('   ✅ Hay clientes con PIN configurados');
      }
    } else {
      console.log('   Response:', JSON.stringify(res.body));
    }
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }

  // 3. Test login con PIN
  console.log('3️⃣  Probando login con PIN 1234...');
  try {
    const res = await request('/api/marketplace/auth/login-pin', 'POST', { pin: '1234' });
    console.log('   Status:', res.status);
    if (res.status === 200) {
      console.log('   ✅ Login exitoso');
      console.log('   Cliente:', res.body.client?.firstName, res.body.client?.lastName);
    } else {
      console.log('   ❌ Login falló:', res.body.message || res.body);
    }
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }

  // 4. Test login con email
  console.log('4️⃣  Probando login con email...');
  try {
    const res = await request('/api/marketplace/auth/login', 'POST', {
      identifier: 'juan@gmail.com',
      password: 'cliente123'
    });
    console.log('   Status:', res.status);
    if (res.status === 200 || res.status === 201) {
      console.log('   ✅ Login exitoso');
    } else {
      console.log('   ❌ Login falló:', res.body.message || res.body);
    }
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }

  console.log('=== FIN DE VERIFICACIÓN ===');
  console.log('');
  console.log('Si los clientes con PIN son 0, ejecuta:');
  console.log('  node reset-marketplace-clients.js');
  console.log('');
  console.log('Para ver logs en tiempo real:');
  console.log('  vercel logs --all');
}

runChecks();
