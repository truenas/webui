/**
 * Story: an admin raises the session timeout from the Access card on System > Advanced Settings, and the account
 * keeps it. The timeout is the account's own `lifetime` preference, edited via the card's Preferences link, so the
 * save is checked on the card's readout and through `auth.me`. It only goes up: a lowered timeout would race the
 * test's own sign-out. `beforeEach` writes a baseline and `afterEach` restores it (`fixtures/preferences.ts`).
 */
import {
  establishPreferenceBaseline, readPreference, restorePreferences,
} from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import { openSessionTimeoutFromAccessCard } from '../flows/access';
import { savePreferences } from '../flows/preferences';
import { accessLocators } from '../locators/access';
import { preferencesLocators } from '../locators/preferences';
import { expect, test } from '../support/fixtures';

/**
 * Where the test starts: ten minutes.
 *
 * Not webui's default of five, which the form's field already holds before it
 * has loaded anything. Starting from a different value is what makes the wait
 * for the field to fill an observation rather than a formality.
 */
const startLifetimeSeconds = 600;

/** What `beforeEach` wrote, and therefore exactly what `afterEach` must undo to. */
let baseline: PreferencesBlob;

/**
 * Two writes: the shared baseline, then the starting timeout on top of it.
 *
 * The baseline is what `afterEach` restores, and it keeps the timeout the
 * account already had, so the timeout every later test runs under is not
 * changed by this one.
 */
test.beforeEach(async ({ api }) => {
  baseline = await establishPreferenceBaseline(api);
  await restorePreferences(api, { ...baseline, lifetime: startLifetimeSeconds });
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and an
  // unguarded call would then write `undefined`, serialized as `null`, over the
  // attribute.
  if (baseline) {
    await restorePreferences(api, baseline);
  }
});

test('an admin raises the session timeout from the Access card, and the account keeps it', async ({
  page, api,
}) => {
  await openSessionTimeoutFromAccessCard(page, '10 minutes', startLifetimeSeconds / 60);
  await page.locator(preferencesLocators.form.sessionTimeout).fill('120');
  await savePreferences(page);

  await expect(page.locator(accessLocators.card.sessionTimeout)).toHaveText('2 hours');

  // Saving is a socket round trip the form does not wait on, so this polls
  // rather than reads once.
  await expect.poll(() => readPreference(api, 'lifetime')).toBe(120 * 60);
});
