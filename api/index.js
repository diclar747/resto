const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Load compiled NestJS (.cjs extension prevents ncc from consuming the files)
  const serverlessPath = path.join(__dirname, 'dist', 'serverless.cjs');
  handler = eval('require')(serverlessPath).default;
} catch (e) {
  handler = (req, res) => {
    let distFiles = [];
    try { distFiles = fs.readdirSync(path.join(__dirname, 'dist')); } catch (_) {}
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ loadError: e.message, dirname: __dirname, distFiles }));
  };
}

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ runtimeError: e.message, stack: e.stack }));
  }
};
