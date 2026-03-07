const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Use eval to completely hide the require from ncc's static analysis
  // ncc cannot trace through eval, so the file must be available via includeFiles
  const serverlessPath = path.join(__dirname, 'dist', 'serverless.js');
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
