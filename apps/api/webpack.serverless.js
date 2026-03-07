const path = require('path');
const webpack = require('webpack');

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
    // Only Prisma stays external (needs native binary engine)
    '@prisma/client': 'commonjs @prisma/client',
    '.prisma/client': 'commonjs .prisma/client',
  },
  plugins: [
    // Ignore optional NestJS deps that aren't installed
    new webpack.IgnorePlugin({ resourceRegExp: /^@nestjs\/microservices/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^bufferutil$/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /^utf-8-validate$/ }),
  ],
  resolve: {
    extensions: ['.js'],
  },
  optimization: {
    minimize: false,
  },
  ignoreWarnings: [/Critical dependency/, /Module not found/],
};
