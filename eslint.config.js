const js = require('@eslint/js');
const babelParser = require('@babel/eslint-parser');
const globals = require('globals');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    ignores: [
      'build/',
      'tests/',
      'coverage/',
      'polyfills/',
      '**/__mocks__/',
      'webpack.config.dev.js',
      'fhir-client.min.js',
      'aggregated-translations',
    ],
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        FHIR: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      curly: ['error', 'all'],
      // the node resolver doesn't understand package.json "exports", which uuid relies on
      'import/no-unresolved': ['error', { commonjs: true, caseSensitive: true, ignore: ['^uuid$'] }],
    },
  },
];
