const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-types': ['error', {
        types: {
          'Function': {
            message: 'Use a more specific function type instead',
            fixWith: '(...args: any[]) => any',
          },
        },
      }],
    },
  },
]; 