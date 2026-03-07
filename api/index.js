const path = require('path');
require('reflect-metadata');

// Load pre-bundled NestJS handler (copied here during build)
const serverlessPath = path.join(__dirname, 'bundle', 'serverless');
const mod = require(serverlessPath);
module.exports = mod.default;
