const path = require('path');

module.exports = {
  entry: './bundle-entry.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
  },
  mode: 'production',
};
