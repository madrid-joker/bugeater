// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  /* ---- 1. What ESLint must never look at -------------------------------- */
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      'playwright/.cache/**',
      'playwright/.auth/**',
    ],
  },

  /* ---- 2. Baselines ------------------------------------------------------ */
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  /* ---- 3. Wire the type-aware rules to our tsconfig ----------------------
   * `projectService: true` is the modern replacement for listing `project`
   * files by hand. It lets typescript-eslint reuse the TS language service,
   * which is what makes rules like no-floating-promises possible at all.
   */
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /* ---- 4. Config files are plain JS — no type-aware linting there -------- */
  {
    files: ['**/*.mjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  /* ---- 5. Playwright-specific correctness rules -------------------------- */
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // Catches `expect(...)` without `await` — a silently ALWAYS-PASSING test.
      'playwright/missing-playwright-await': 'error',

      // `test.only` reaching CI means CI runs one test and reports success.
      'playwright/no-focused-test': 'error',

      // Hardcoded sleeps are the number one source of flake.
      'playwright/no-wait-for-timeout': 'error',

      // Force auto-retrying assertions over manual `expect(await x.textContent())`.
      'playwright/prefer-web-first-assertions': 'error',

      // A test with no assertion proves nothing.
      'playwright/expect-expect': 'error',

      // Skipped tests are debt — visible, not silent.
      'playwright/no-skipped-test': 'warn',

      // Branching in a test means it tests different things on different runs.
      'playwright/no-conditional-in-test': 'warn',
    },
  },

  /* ---- 6. Project-wide TypeScript rules ---------------------------------- */
  {
    files: ['**/*.ts'],
    rules: {
      // The async-safety pair. In a suite that is ~100% async, these two
      // rules prevent more real bugs than everything else combined.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // `import type` keeps type-only imports out of the emitted graph.
      '@typescript-eslint/consistent-type-imports': 'error',

      // Allow `_`-prefixed unused args (common in fixture signatures).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  /* ---- 7. Must stay LAST: switches off rules that fight Prettier --------- */
  prettier,
);
