/**
 * Story: a preference belongs to the account, not to the browser that set it.
 *
 * The other preference tests live in `tests/preferences.e2e.ts` and reload the
 * page. This one is here, without the token bypass, because reloading is not the
 * claim the feature makes — signing in tomorrow is, and only a real sign-out and
 * sign-in crosses that boundary (R4.2).
 *
 * One test, deliberately. Every submitted form spends from the unauthenticated
 * rate limit (20 per method per IP per 60s), and this one spends two.
 */
import { readPreference, readPreferences, restorePreferences } from '../../fixtures/preferences';
import type { PreferencesBlob } from '../../fixtures/preferences';
import { signIn, signOut } from '../../flows/auth';
import {
  chooseTheme, expectTheme, openPreferencesForm, savePreferences,
} from '../../flows/preferences';
import { expect, test } from '../../support/fixtures';

/** Light, where the appliance ships dark — see the note in `preferences.e2e.ts`. */
const testTheme = { label: 'Paper', value: 'paper' };

let snapshot: PreferencesBlob;

test.beforeEach(async ({ api }) => {
  snapshot = await readPreferences(api);
});

/**
 * Unconditional, and it has to be: this test signs in as the account the rest of
 * the suite uses, so a theme it left behind would be the theme every later test
 * ran under.
 */
test.afterEach(async ({ api }) => {
  await restorePreferences(api, snapshot);
});

test('a preference set in one session is there in the next', async ({ page, api, config }) => {
  await signIn(page, config.username, config.password);

  await openPreferencesForm(page);
  await chooseTheme(page, testTheme.label);
  await savePreferences(page);
  await expectTheme(page, testTheme.value);

  await expect.poll(() => readPreference(api, 'userTheme')).toBe(testTheme.value);

  await signOut(page);

  // The app also caches the theme in `localStorage`, so a second sign-in in this
  // same browser would come up in Paper whether or not the appliance had kept
  // anything. Clearing it is what makes the next sign-in a *different browser*
  // in every way that matters, and so what makes this a test of the account
  // rather than of the tab.
  // Bare `localStorage`, not `window.localStorage`: this callback is serialized
  // and runs in the page, where the lint rule's advice (inject Angular's WINDOW)
  // has nothing to refer to.
  await page.evaluate(() => localStorage.clear());

  await signIn(page, config.username, config.password);

  await expectTheme(page, testTheme.value);
});
