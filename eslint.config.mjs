import js from '@eslint/js';
import globals from 'globals';

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
      // `globals` rather than a hand-written list. The hand-written one was missing `URL` and
      // `fetch` within an hour of the first script that used them, and an incomplete list fails
      // as `no-undef` on correct code, which teaches people to disable the rule.
      globals: globals.nodeBuiltin,
    },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
