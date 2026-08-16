import * as dotenv from 'dotenv';

/**
 * Single source of truth for environment configuration.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `process.env` is a bag of `string | undefined` that can be read from
 * anywhere. That is a problem for three reasons:
 *
 *   1. Type safety - every read site has to handle `undefined` again.
 *   2. Discoverability - you cannot tell what the suite needs without grepping.
 *   3. Failure timing - a missing variable surfaces deep inside a test as a
 *      confusing assertion failure instead of a clear startup error.
 *
 * So `process.env` is read HERE and nowhere else. Everything downstream imports
 * a typed object. This is the same reason applications have a config module:
 * one chokepoint, validated once.
 */

// `quiet` suppresses dotenv's startup banner. Missing .env is not an error -
// CI supplies real environment variables instead of a file.
dotenv.config({ quiet: true });

/**
 * Reads a required variable, failing loudly and immediately if absent.
 *
 * Deliberately NOT called at module load for credentials - see `testUser`.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
        `  Fix: copy .env.example to .env and fill in ${name}.\n` +
        `  In CI: add ${name} as a repository secret.`,
    );
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value;
}

function optionalInt(name: string): number | undefined {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, received: "${raw}"`);
  }
  return parsed;
}

export const env = {
  /** Root URL of the application under test. */
  baseUrl: optionalEnv('BASE_URL', 'https://www.saucedemo.com/'),

  /** True when running on a CI runner. GitHub Actions sets CI=true for us. */
  isCI: Boolean(process.env.CI),

  /** Explicit worker override; `undefined` lets Playwright decide. */
  workers: optionalInt('PW_WORKERS'),

  /** Run browsers headed without passing a CLI flag. */
  headed: process.env.PW_HEADED === '1',

  /**
   * Credentials for the dedicated automation account.
   *
   * NOTE the getter. If these were read eagerly, the whole suite would refuse
   * to even LIST tests without credentials configured - which would block the
   * many tests that need no login at all. A getter defers the failure to the
   * exact moment something actually needs to authenticate, which is both more
   * convenient and a much clearer error.
   */
  get testUser(): { email: string; password: string } {
    return {
      email: requireEnv('TEST_USER_EMAIL'),
      password: requireEnv('TEST_USER_PASSWORD'),
    };
  },
} as const;
