import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.{js,mjs,cjs,ts}']
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            parserOptions: {
                sourceType: 'module'
            }
        }
    },
  {
    ignores: [
        '__mocks__/**',
        'coverage/**',
        'dist/**',
        'node_modules/**',
    ],
  },
  pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
];