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
import {
  establishPreferenceBaseline, readPreference, restorePreferences,
} from '../../fixtures/preferences';
import type { PreferencesBlob } from '../../fixtures/preferences';
import { signIn, signOut } from '../../flows/auth';
import {
  chooseTheme, expectTheme, openPreferencesForm, savePreferences,
} from '../../flows/preferences';
import { expect, test } from '../../support/fixtures';

/** Light, where the appliance ships dark — see the note in `preferences.e2e.ts`. */
const testTheme = { label: 'Paper', value: 'paper' };

let baseline: PreferencesBlob;

test.beforeEach(async ({ api }) => {
  baseline = await establishPreferenceBaseline(api);
});

/**
 * Unconditional, and it has to be: this test signs in as the account the rest of
 * the suite uses, so a theme it left behind would be the theme every later test
 * ran under.
 */
test.afterEach(async ({ api }) => {
  // Guarded because Playwright runs this even when `beforeEach` threw, and an
  // unguarded call would write `undefined` — serialized as `null` — over the
  // attribute, on top of a failure that already has a cause worth reading.
  if (baseline) {
    await restorePreferences(api, baseline);
  }
});

test('a preference set in one session is there in the next', async ({ page, api, config }) => {
  await signIn(page, config.username, config.password);

  await openPreferencesForm(page);
  await chooseTheme(page, testTheme.label);
  await savePreferences(page);
  await expectTheme(page, testTheme.value);

  await expect.poll(() => readPreference(api, 'userTheme')).toBe(testTheme.value);

  await signOut(page);

  // The theme is cached in the browser as well as stored on the account —
  // `TnThemeService` reads `localStorage` at startup and applies the class
  // before anything has asked the appliance, and webui keeps its own copy in
  // `sessionStorage` (`theme.service.ts`). Left in place, a second sign-in here
  // would come up in Paper whether or not the appliance had kept a thing, and
  // this test would prove nothing.
  //
  // Both, not just the one that happens to be load-bearing today: which of the
  // two wins is a detail of startup ordering, and a test whose meaning depends
  // on that ordering is a test that goes quietly vacuous when it changes.
  //
  // Bare globals rather than `window.*`: this callback is serialized and runs in
  // the page, where the lint rule's advice (inject Angular's WINDOW) has nothing
  // to refer to.
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await signIn(page, config.username, config.password);

  await expectTheme(page, testTheme.value);
});
