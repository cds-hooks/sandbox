const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const Autoprefixer = require('autoprefixer');
const CustomProperties = require('postcss-custom-properties');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, './build');
const SRC_DIR = path.resolve(__dirname, './src');

const globalCss = [
  /node_modules\/terra-icon\/lib\/Icon/,
  /node_modules\/terra-date-picker/,
];

const codeMirrorCss = [
  path.resolve(path.resolve(__dirname), 'node_modules/codemirror/lib'),
  path.resolve(path.resolve(__dirname), 'node_modules/codemirror/addon/lint/'),
];

const cssLoaderNoModules = {
  loader: 'css-loader',
  options: {
    sourceMap: true,
    importLoaders: 2,
    localIdentName: '[name]__[local]___[hash:base64:5]',
  },
};

const cssLoaderWithModules = Object.assign({}, cssLoaderNoModules, { 
  options: {
    modules: true,
    sourceMap: true,
    importLoaders: 2,
    localIdentName: '[name]__[local]___[hash:base64:5]',
  },
});

const postCssLoader = {
  loader: 'postcss-loader',
  options: {
    plugins() {
      return [
        Autoprefixer(),
        CustomProperties(),
      ];
    },
  },
};

const sassLoader = {
  loader: 'sass-loader',
};

const config = {
  entry: {
    app: ['@babel/polyfill', `${SRC_DIR}/index.jsx`],
    'smart-launch': ['@babel/polyfill', `${SRC_DIR}/retrieve-data-helpers/smart-authorize.js`],
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
  },
  context: __dirname,
  resolve: {
    extensions: ['.js', '.jsx', '.json', '*'],
    modules: [path.resolve(__dirname, 'aggregated-translations'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        include: globalCss,
        exclude: codeMirrorCss,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            cssLoaderNoModules,
            postCssLoader,
            sassLoader,
          ],
        }),
      },
      {
        test: /\.(scss|css)$/,
        exclude: globalCss.concat(codeMirrorCss),
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            cssLoaderWithModules,
            postCssLoader,
            sassLoader,
          ],
        }),
      },
      {
        test: /node_modules\/.*\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.jsx?/,
        include: SRC_DIR,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.pem/,
        use: [
          {
            loader: 'raw-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new CopyWebpackPlugin([
      {
        from: '*.html',
      },
      {
        from: './fhir-client.min.js',
      },
    ]),
    new webpack.NamedChunksPlugin(),
    new webpack.DefinePlugin({
      'runtime.FHIR_URL': JSON.stringify(process.env.FHIR_URL || 'https://api.hspconsortium.org/cdshooksdstu2/open')
    }),
  ],
};

module.exports = config;
