const { merge } = require('webpack-merge');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'cheap-source-map',
  plugins: [ ],
  optimization: {
    minimizer: [new TerserPlugin()],
    chunkIds: 'named',
  },
});
