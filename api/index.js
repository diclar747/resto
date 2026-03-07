require('reflect-metadata');
// Static require so ncc can trace and bundle this file
// The webpack bundle is self-contained (NestJS + all deps pre-bundled)
// Only @prisma/client remains external, handled by includeFiles
module.exports = require('./serverless-bundle').default;
