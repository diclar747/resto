const path = require('path');
require('reflect-metadata');

// Dynamic path prevents Vercel's ncc from tracing into the bundle
const bundlePath = path.join(__dirname, '..', 'apps', 'api', 'bundle', 'serverless');
const mod = require(bundlePath);
module.exports = mod.default;
