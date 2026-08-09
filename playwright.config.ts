import { defineConfig, devices } from '@playwright/test';
import { env } from '@config/env';

/**
 * Playwright configuration.
 *
 * CONTEXT THAT DRIVES THESE CHOICES
 * ---------------------------------
 * The application under test is a LIVE PRODUCTION site (single environment,
 * Firebase-hosted). There is no staging, no database reset, no seeding hook.
 * Several settings below are deliberately more conservative than the defaults
 * because of that - each is marked with "PROD:".
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* ---- Where things live ------------------------------------------------ */
  testDir: './tests',
  outputDir: './test-results',

  /* ---- Parallelism ------------------------------------------------------
   * `fullyParallel: true` runs tests inside the same file in parallel, not
   * just files against each other. This is the setting that makes a suite
   * fast, and it also enforces good hygiene: it is impossible for test #2 to
   * depend on state left behind by test #1 if they run simultaneously. If
   * enabling it breaks your suite, the suite had hidden coupling and you have
   * just found a real defect in your tests.
   *
   * PROD: worker count is capped low. The default (~half your CPU cores) would
   * point 6-8 concurrent browsers at a personal Firebase project and risk
   * tripping quotas or rate limits. Raise via PW_WORKERS once you know the
   * app's tolerance.
   */
  fullyParallel: true,
  workers: env.workers ?? (env.isCI ? 2 : 4),

  /* ---- Failure handling -------------------------------------------------
   * `forbidOnly` makes CI fail if someone commits `test.only`. Without it, a
   * stray `.only` means CI runs ONE test and reports a green build - the most
   * dangerous kind of false confidence there is.
   *
   * Retries ONLY on CI, never locally. This is deliberate: locally you WANT to
   * see flake immediately so you fix it. On CI, a retry distinguishes genuine
   * failures from infrastructure noise, and Playwright reports anything that
   * passed on retry as "flaky" rather than hiding it.
   */
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,

  /* ---- Timeouts ---------------------------------------------------------
   * Three different timeouts, commonly confused:
   *
   *   timeout          - whole test, start to finish
   *   expect.timeout   - a single auto-retrying assertion
   *   actionTimeout    - a single action (click, fill) waiting for actionability
   *
   * The instinct when a test is flaky is to raise these. That is almost always
   * wrong: it converts a 5-second failure into a 60-second failure without
   * fixing anything. Timeouts should be tight enough that a real hang fails
   * fast, and generous enough to absorb honest network variance.
   */
  timeout: 30_000,
  expect: {
    timeout: 7_000,
  },

  /* ---- Reporters --------------------------------------------------------
   * Local: `list` for live feedback, plus an HTML report opened only when
   * something fails (auto-opening on success is pure noise).
   *
   * CI: `github` adds inline pull-request annotations on the failing line.
   * `junit` is the machine-readable format most CI dashboards ingest.
   * `html` is never auto-opened on a runner - it is uploaded as an artifact.
   */
  reporter: env.isCI
    ? [
        ['list'],
        ['github'],
        ['html', { open: 'never' }],
      ]
    : [['list'], ['html', { open: 'on-failure' }]],

  /* ---- Defaults applied to every test ----------------------------------- */
  use: {
    baseURL: process.env.BASE_URL,
    headless: !env.headed,

    /* Determinism. Without pinning locale and timezone, a test asserting on a
     * formatted date passes in Kyiv and fails on a UTC CI runner - a classic
     * "works on my machine" failure that costs hours to diagnose. */
    locale: 'en-US',
    timezoneId: 'UTC',

    /* Debugging artefacts. The guiding principle is: capture nothing when
     * things pass (it is slow and produces gigabytes), capture everything the
     * moment they do not.
     *
     * `trace: 'on-first-retry'` is the sweet spot. A trace is a full recording
     * - DOM snapshots per action, network, console, sources - explorable in
     * the Playwright trace viewer. It is the single best debugging tool in
     * this ecosystem, and it costs nothing on a green run. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 20_000,

    /* Which attribute `page.getByTestId()` reads. The default is
     * `data-testid`. BugEater currently ships ZERO test ids, so this does
     * nothing yet - it is here so that when you add them to the app, the
     * framework already knows. If you standardise on `data-qa` instead,
     * this one line is the only change required. */
    testIdAttribute: 'data-testid',
  },

  /* ---- Projects ---------------------------------------------------------
   * A "project" is a named run configuration. Projects are how Playwright
   * expresses browsers, devices, auth states, and setup ordering - all with
   * the same mechanism.
   *
   * Chromium only, by choice. Running every test on three engines triples CI
   * time and flake surface to catch very few real bugs. The mature pattern is
   * a full Chromium run plus a small cross-browser smoke subset on a schedule;
   * commented scaffolding for that is below.
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Added in a later layer, once we have a smoke tag to point them at:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grep: /@smoke/ },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] },  grep: /@smoke/ },
    // { name: 'mobile',  use: { ...devices['Pixel 7'] },         grep: /@smoke/ },
  ],
});
