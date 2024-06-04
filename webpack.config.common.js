const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Autoprefixer = require('autoprefixer');
const CustomProperties = require('postcss-custom-properties');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, './build');
const SRC_DIR = path.resolve(__dirname, './src');

const aggregateTranslations = require('terra-aggregate-translations');

const aggregateOptions = {
    baseDir: __dirname,
    excludes: [''],
    locales: ['en', 'en-US'],
    format: 'es6',
};

aggregateTranslations(aggregateOptions);



const globalCss = [
  /node_modules\/terra-icon\/lib\/Icon/,
  /node_modules\/terra-date-picker/,
];

const codeMirrorCss = [
  path.resolve(path.resolve(__dirname), 'node_modules/codemirror/lib'),
  path.resolve(path.resolve(__dirname), 'node_modules/codemirror/addon/lint/'),
];

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
    fallback: {
      "path": false,
    } 
  },
  module: {
    rules: [{
        test: /node_modules\/.*\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s?[ac]ss$/i,
        use: [
         'style-loader',
         {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules:{
                mode: 'local',
              localIdentName: "[name]__[local]___[hash:base64:5]",
              }
            },
          },
          {
            loader: 'postcss-loader',
            options: {options: {}}
          },
          {
            loader: 'sass-loader',
            options: {
              webpackImporter: false,
            },
          }
          ],
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
        test: /\.jsx?$/,
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
    /*
    new MiniCssExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
    */
    new CopyWebpackPlugin([
      {
        from: '*.html',
      },
      {
        from: './fhir-client.min.js',
      },
    ]),
    new webpack.DefinePlugin({
      'runtime.FHIR_URL': JSON.stringify(process.env.FHIR_URL || 'https://api.hspconsortium.org/cdshooksdstu2/open')
    }),
  ],
  stats: {
    errorDetails: true,
  },
};

module.exports = config;
