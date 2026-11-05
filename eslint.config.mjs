import js from '@eslint/js';

/**
 * Lints the repository's own JavaScript: the audit and link-check scripts in `scripts/`, and this
 * config and `astro.config.mjs`.
 *
 * Deliberately NOT installed yet: `typescript-eslint` and `eslint-plugin-astro`. There is no
 * TypeScript in the tree beyond `tsconfig.json`, and `astro check` already typechecks `.astro`
 * templates and their frontmatter, so the two would add five dev dependencies (the Astro plugin
 * peers both `eslint-plugin-jsx-a11y` and `eslint-plugin-jsx-a11y-x`) to lint a single template
 * containing no JSX. They land with the code that needs them: typescript-eslint with the typed
 * content modules in M1-3, the Astro plugin when the templates stop being trivial.
 */
export default [
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', '.vercel/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly' },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
