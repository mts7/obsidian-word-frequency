import pluginJs from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                sourceType: 'module',
            },
        },
    },
    {
        ignores: ['__mocks__/**', 'coverage/**', 'dist/**', 'node_modules/**', '.stryker-tmp/**'],
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            curly: ['error', 'all'],
            'id-length': [
                'error',
                {
                    min: 3,
                    max: 24,
                    properties: 'always',
                    exceptions: ['id', 'on', 'e', 'i', '_'],
                },
            ],
        },
    },
];
