import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default defineConfig(
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    },

    js.configs.recommended,
    tseslint.configs.recommended,

    {
        files: ['src/**/*.ts'],

        languageOptions: {
            globals: globals.node,
        },

        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            'no-console': 'error',
        },
    },

    prettier,
);
