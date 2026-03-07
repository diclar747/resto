import 'reflect-metadata';
import handler from './serverless';

module.exports = async (req: any, res: any) => {
  try {
    await handler(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};
