const axios = require('axios');

const pins = [
    { name: 'Super Admin', email: 'superadmin@restaurante.com', pin: '9999' },
    { name: 'Admin', email: 'admin@restaurante.com', pin: '0000' },
    { name: 'Gerente', email: 'gerente@restaurante.com', pin: '4444' },
    { name: 'Cajero', email: 'cajero@restaurante.com', pin: '2222' },
    { name: 'Camarero', email: 'camarero@restaurante.com', pin: '1111' },
    { name: 'Cocina', email: 'cocina@restaurante.com', pin: '3333' }
];

const branchId = 'branch-main';
const baseUrl = 'http://localhost:3000/api';

async function testPins() {
    console.log('--- Probando Login por PIN ---');
    for (const item of pins) {
        try {
            const resp = await axios.post(`${baseUrl}/auth/pin-login`, {
                pin: item.pin,
                branchId: branchId
            });
            console.log(`[OK] ${item.name} (${item.pin}) -> Rol: ${resp.data.user.role}`);
        } catch (err) {
            console.log(`[FAIL] ${item.name} (${item.pin}) -> Error: ${err.response?.data?.message || err.message}`);
        }
    }
}

testPins();
