const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
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
        use: ['style-loader', 'css-loader'],
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
  plugins: [
    new HtmlWebpackPlugin({
      title: 'RSS агрегатор',
      template: path.resolve(__dirname, 'src', 'template.html'),
    }),
  ],
  entry: './src/init.js',
  target: 'web',
  devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index_bundle.js',
  },
};
