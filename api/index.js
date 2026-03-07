const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Use path.join to create a dynamic require that ncc won't trace
  // The actual file is included via "includeFiles" in vercel.json
  const serverlessPath = path.join(__dirname, 'dist', 'serverless');
  handler = require(serverlessPath).default;
} catch (e) {
  handler = (req, res) => {
    // Debug: list files in __dirname to see what's available
    let files = [];
    try { files = fs.readdirSync(__dirname); } catch (_) {}
    let distFiles = [];
    try { distFiles = fs.readdirSync(path.join(__dirname, 'dist')); } catch (_) {}
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      loadError: e.message,
      dirname: __dirname,
      files: files,
      distFiles: distFiles,
    }));
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
