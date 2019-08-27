module.exports = {
  "presets": [
      '@babel/preset-react',
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ],
  plugins: ['@babel/plugin-transform-async-to-generator', '@babel/plugin-transform-spread']
};
