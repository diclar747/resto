// Thin wrapper - loads esbuild bundle from .txt file (ncc won't process .txt as JS)
const fs = require('fs');
const path = require('path');
const Module = require('module');

let handler;
try {
  const bundlePath = path.join(__dirname, 'nestjs-bundle.txt');
  const code = fs.readFileSync(bundlePath, 'utf8');

  // Create a virtual module from the bundle code
  const m = new Module(__filename);
  m.paths = Module._nodeModulePaths(__dirname);
  m._compile(code, bundlePath);
  handler = m.exports.default || m.exports;
} catch (e) {
  let files = [];
  try { files = fs.readdirSync(__dirname); } catch (_) {}
  handler = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ loadError: e.message, dirname: __dirname, files }));
  };
}

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ runtimeError: e.message }));
  }
};
