const path = require("path");
const webpack = require('webpack');

const BUILD_PATH = 'dist';
const BUILD_FILE_NAME = 'main';

const entry = {
};

entry[BUILD_FILE_NAME] = './main.js';

module.exports = {
  entry: entry ,
  devtool: 'inline-source-map',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, BUILD_PATH),
    library: 'ShadowBakerClient'
  },

  devServer: {
    watchContentBase: true,
  },
  
  resolve: {
    modules: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, 'lib')]
  },
};
