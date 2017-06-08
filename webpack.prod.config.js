var webpack = require('webpack');

module.exports = {
  node: {
    fs: "empty"
  },
  entry: {
    app: [
      "./src/scripts/main.js"
    ]
  },
  output: {
    path: "./build",
    filename: "bundle.js"
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      "runtime.CDS_HOOKS_URL": JSON.stringify(process.env.CDS_HOOKS_URL || "http://hooks.fhir.me:8082"),
      "runtime.FHIR_URL": JSON.stringify(process.env.FHIR_URL || "https://sb-fhir-dstu2.smarthealthit.org/api/smartdstu2/open")
    })
  ],
  resolve: {
    modulesDirectories: ['node_modules'],
  },
  module: {
    loaders: [
      {
        test: /\.json?$/,
        loader: "json"
      },
      {
        test: /\.jsx?$/,
        loader: "babel?presets[]=react,presets[]=es2015",
        exclude: /node_modules/
      },

      {
        test: /\.sass$/,
        loader: "style!css!sass?indentedSyntax=true&outputStyle=expanded"
      },

      {
        test: /\.(ttf|eot|svg)$/,
        loader: 'file-loader'
      },

      {
        test: /\.woff2?$/,
        loader: 'url-loader?limit=10000&minetype=application/font-woff'
      },

      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader?limit=8192'
      },

      {
        test: /\.html$/,
        loader: "file?name=[path][name].[ext]&context=./src"
      }
    ]
  }
};
