const webpack = require('webpack');

module.exports = {
  entry: './main.js',
  output: {
    path: __dirname,
    filename: 'ol-sitna.js',
	library: 'ol'
  },
};
