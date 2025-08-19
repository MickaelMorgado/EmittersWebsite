// eslint.config.js
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  ...compat.config({
    plugins: ['prettier', 'prefer-arrow'],
    rules: {
      'prefer-arrow-callback': 'error',
      'func-style': ['error', 'expression'],
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-arrow/prefer-arrow-functions': [
        'error',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
    },
  }),
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'tools/js/**', // ignore all JS in tools/js
      'assets/**', // ignore all JS in assets folder
    ],
  },
];
