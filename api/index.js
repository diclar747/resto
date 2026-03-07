const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Load the webpack-bundled NestJS app (saved as .cjs to prevent ncc from removing it)
  const bundlePath = path.join(__dirname, '..', '_api_bundle.cjs');
  handler = eval('require')(bundlePath).default;
} catch (e) {
  handler = (req, res) => {
    let rootFiles = [];
    try { rootFiles = fs.readdirSync(path.join(__dirname, '..')).slice(0, 30); } catch (_) {}
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ loadError: e.message, dirname: __dirname, rootFiles }));
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
