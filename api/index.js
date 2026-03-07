let handler;

try {
  require('reflect-metadata');
  handler = require('./serverless-bundle').default;
} catch (loadError) {
  // If the bundle fails to load, return the error as JSON
  handler = async (req, res) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Failed to load serverless bundle',
      message: loadError.message,
      stack: loadError.stack,
    }));
  };
}

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (runtimeError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Runtime error',
      message: runtimeError.message,
      stack: runtimeError.stack,
    }));
  }
};
