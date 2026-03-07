const path = require('path');

module.exports = {
  entry: './dist/serverless.js',
  target: 'node',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'bundle'),
    filename: 'serverless.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    '.prisma/client': 'commonjs .prisma/client',
    // Optional NestJS peer deps
    '@nestjs/microservices': 'commonjs @nestjs/microservices',
    '@nestjs/microservices/microservices-module': 'commonjs @nestjs/microservices/microservices-module',
    // Optional native addons
    'bufferutil': 'commonjs bufferutil',
    'utf-8-validate': 'commonjs utf-8-validate',
  },
  resolve: {
    extensions: ['.js'],
  },
  optimization: {
    minimize: false,
  },
  ignoreWarnings: [/Critical dependency/],
};
