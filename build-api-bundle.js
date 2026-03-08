// Build script: bundles NestJS API into a single serverless function file
const { execSync } = require('fs');
const fs = require('fs');
const path = require('path');

// The wrapper that Vercel will use as the entry point
const WRAPPER = `
require('reflect-metadata');
const bundle = require('./bundle');
const handler = bundle.default || bundle;

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message, stack: e.stack }));
  }
};
`;

fs.writeFileSync(path.join(__dirname, 'api', 'index.js'), WRAPPER.trim() + '\n');
console.log('Wrote api/index.js wrapper');
