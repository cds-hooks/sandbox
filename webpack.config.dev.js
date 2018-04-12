const merge = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './build',
  },
});
