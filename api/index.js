const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Load webpack bundle saved as .cjs (ncc won't consume .cjs files from includeFiles)
  const bundlePath = path.join(__dirname, 'dist', 'handler.cjs');
  handler = eval('require')(bundlePath).default;
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
