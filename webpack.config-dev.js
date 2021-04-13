const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config-common.js');

module.exports = merge(common, {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader', 'css-loader',
        ],
      },
    ],
  },
  devServer: {
    open: true,
    contentBase: path.resolve(__dirname, 'dist'),
    watchOptions: {
      poll: true,
      ignored: './node_modules/',
    },
  },
  mode: 'development',
  devtool: 'eval-source-map',
});
