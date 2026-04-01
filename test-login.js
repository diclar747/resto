#!/usr/bin/env node
/**
 * Script para probar login en producción
 * Uso: node test-login.js https://resto-amber.vercel.app
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.argv[2] || 'https://resto-amber.vercel.app';

console.log('=== TEST DE LOGIN ===');
console.log('URL:', BASE_URL);
console.log('');

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  // 1. Test versión
  console.log('1️⃣  Test /marketplace/test/version');
  try {
    const res = await request('/api/marketplace/test/version');
    console.log('   Status:', res.status);
    console.log('   Body:', res.body.substring(0, 200));
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    console.log('');
  }

  // 2. Test setup/init
  console.log('2️⃣  Test /marketplace/setup/init (inicializar datos)');
  try {
    const res = await request('/api/marketplace/setup/init', 'POST', { secret: 'resto-setup-2024' });
    console.log('   Status:', res.status);
    console.log('   Body:', res.body.substring(0, 500));
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    console.log('');
  }

  // 3. Test debug-pins
  console.log('3️⃣  Test /marketplace/auth/debug-pins');
  try {
    const res = await request('/api/marketplace/auth/debug-pins');
    console.log('   Status:', res.status);
    console.log('   Body:', res.body.substring(0, 500));
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    console.log('');
  }

  // 4. Test login con PIN
  console.log('4️⃣  Test /marketplace/auth/login-pin (PIN: 1234)');
  try {
    const res = await request('/api/marketplace/auth/login-pin', 'POST', { pin: '1234' });
    console.log('   Status:', res.status);
    console.log('   Body:', res.body.substring(0, 300));
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    console.log('');
  }

  // 5. Test login con email
  console.log('5️⃣  Test /marketplace/auth/login (juan@gmail.com)');
  try {
    const res = await request('/api/marketplace/auth/login', 'POST', { 
      identifier: 'juan@gmail.com', 
      password: 'cliente123' 
    });
    console.log('   Status:', res.status);
    console.log('   Body:', res.body.substring(0, 300));
    console.log('');
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    console.log('');
  }

  console.log('=== FIN DE TESTS ===');
}

test();
