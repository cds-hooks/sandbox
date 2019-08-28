const merge = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  devtool: 'cheap-source-map',
  mode: 'production',
  plugins: [ ],
});
