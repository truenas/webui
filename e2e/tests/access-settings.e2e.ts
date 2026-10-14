/**
 * Story: an admin changes the session timeout from the Access card on
 * System > Advanced Settings, and the account keeps it.
 *
 * The card shows the timeout but does not own it. It is the signed-in account's
 * own preference, `lifetime` in seconds, and the card's "Preferences" link opens
 * the Preferences form, which edits it in minutes. So the save is asserted the
 * way the preferences spec does it: the card's readout says the screen believed
 * it, `auth.me` says the appliance stored it.
 *
 * The timeout only goes up. **Session Timeout drops an idle session**, so a test
 * that lowered it would be racing its own sign-out.
 *
 * Preferences hang off the account the whole suite signs in as, so `beforeEach`
 * writes a known baseline and `afterEach` writes it back. See
 * `fixtures/preferences.ts`.
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
