import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
    },
  },
  {
    ignores: ['dist', 'docs', 'test'],
  }
);
