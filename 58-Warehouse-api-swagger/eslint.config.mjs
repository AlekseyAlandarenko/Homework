import globals from 'globals';
import pluginJs from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
	{
		ignores: ['dist', 'node_modules', 'eslint.config.mjs'],
	},
	pluginJs.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
		},
		rules: {
			...tsPlugin.configs.recommended.rules,
		},
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
  
	{
		files: ['**/*.spec.ts', '**/*.test.ts'],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			'@typescript-eslint': tsPlugin,
			prettier: prettierPlugin,
		},
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module',
			},
		},
		rules: {
			'prettier/prettier': [
				'error',
				{
					singleQuote: true,
					useTabs: true,
					semi: true,
					trailingComma: 'all',
					bracketSpacing: true,
					printWidth: 100,
					endOfLine: 'auto',
				},
			],
			'@typescript-eslint/ban-types': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
		},
	},
];