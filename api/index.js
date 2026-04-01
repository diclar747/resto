// Thin wrapper - loads esbuild bundle from .txt file (ncc won't process .txt as JS)
const fs = require('fs');
const path = require('path');
const Module = require('module');

console.log('[API] Starting up...');
console.log('[API] __dirname:', __dirname);

let handler;
let loadError = null;

try {
  const bundlePath = path.join(__dirname, 'nestjs-bundle.txt');
  console.log('[API] Bundle path:', bundlePath);
  
  if (!fs.existsSync(bundlePath)) {
    throw new Error('Bundle file not found: ' + bundlePath);
  }
  
  const stats = fs.statSync(bundlePath);
  console.log('[API] Bundle size:', stats.size, 'bytes');
  
  const code = fs.readFileSync(bundlePath, 'utf8');
  console.log('[API] Bundle loaded, compiling...');

  // Create a virtual module from the bundle code
  const m = new Module(__filename);
  m.paths = Module._nodeModulePaths(__dirname);
  m._compile(code, bundlePath);
  handler = m.exports.default || m.exports;
  
  console.log('[API] Handler loaded successfully');
  console.log('[API] Handler type:', typeof handler);
} catch (e) {
  console.error('[API] Failed to load bundle:', e.message);
  loadError = e;
  
  let files = [], parentFiles = [], taskFiles = [];
  try { files = fs.readdirSync(__dirname); } catch (_) {}
  try { parentFiles = fs.readdirSync(path.join(__dirname, '..')); } catch (_) {}
  try { taskFiles = fs.readdirSync('/var/task'); } catch (_) {}
  
  handler = (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Failed to load API bundle',
      message: e.message,
      stack: e.stack,
      dirname: __dirname, 
      files, 
      parentFiles, 
      taskFiles 
    }));
  };
}

module.exports = async (req, res) => {
  console.log('[API] Request:', req.method, req.url);
  
  if (loadError) {
    console.error('[API] Cannot handle request, bundle failed to load');
  }
  
  try {
    await handler(req, res);
  } catch (e) {
    console.error('[API] Runtime error:', e.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      runtimeError: e.message,
      stack: e.stack,
      url: req.url,
      method: req.method
    }));
  }
};
