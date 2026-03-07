const path = require('path');
const fs = require('fs');

let handler;
try {
  require('reflect-metadata');
  // Load compiled NestJS from _api_dist (outside api/ dir so ncc can't consume it)
  const serverlessPath = path.join(__dirname, '..', '_api_dist', 'serverless.js');
  handler = eval('require')(serverlessPath).default;
} catch (e) {
  handler = (req, res) => {
    let rootFiles = [], distFiles = [];
    try { rootFiles = fs.readdirSync(path.join(__dirname, '..')).slice(0, 20); } catch (_) {}
    try { distFiles = fs.readdirSync(path.join(__dirname, '..', '_api_dist')).slice(0, 20); } catch (_) {}
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ loadError: e.message, dirname: __dirname, rootFiles, distFiles }));
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
