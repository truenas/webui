/**
 * Story: a preference is a promise that something will still be true later.
 *
 * That is the whole of what these screens claim, and it is the one claim no
 * layer below this can check. A unit test can prove the reducer produced a new
 * object and the effect called `auth.set_attribute`; only a real browser against
 * a real appliance can say the value came back.
 *
 * So every test here asserts twice, and the pair is the point: the screen
 * re-rendering says the app believed the change, `auth.me` says the appliance
 * stored it. A preference that only ever reached the store would satisfy the
 * first and fail the second, which is exactly the bug worth catching.
 *
 * ## Why the setup and teardown are unusual
 *
 * Preferences hang off the account the whole suite signs in as, so a test that
 * leaves one behind changes what every later test sees — a date format changes
 * the text in every date cell, a language translates the app. There is nothing
 * to delete, so `beforeEach` writes a known baseline and `afterEach` writes the
 * same one back.
 *
 * Written rather than observed, which matters more here than it first looks: a
 * test that read its starting theme off the appliance would be asserting a
 * precondition instead of establishing one, and a run interrupted between a
 * change and its restore would leave the next run measuring from somewhere
 * nobody chose. See `fixtures/preferences.ts`.
 */
import { ensureGroupAbsent, ensureGroupPresent } from '../fixtures/groups';
import {
  establishPreferenceBaseline, preferenceBaseline, readPreference, restorePreferences,
} from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import { goToGroups } from '../flows/navigation';
import {
  chooseTheme, discardPreferences, expectTheme, openPreferencesForm, savePreferences,
} from '../flows/preferences';
import { groupsLocators } from '../locators/groups';
import { preferencesLocators } from '../locators/preferences';
import { expect, test } from '../support/fixtures';

/**
 * A theme picked for being unmistakable rather than pretty.
 *
 * Light, where the appliance ships dark, so a test that silently failed to
 * apply it would not pass by looking the same. Its label and its stored value
 * agree (`Paper` / `paper`), which keeps the locator note in
 * `locators/preferences.ts` from being load-bearing here.
 */
const testTheme = { label: 'Paper', value: 'paper' };

/**
 * A built-in group that is certain to be on the first page of the list.
 *
 * Not `builtin_administrators`, which is the obvious choice and the wrong one:
 * the list sorts by GID ascending and pages at 50, and on a stock appliance that
 * group is 79th of 93 — so it is on page *two* and the row is simply not in the
 * DOM. `wheel` is GID 0, so it is first whatever else exists. This is the
 * pagination gap recorded under Known gaps in `docs/status.md`, met head-on.
 */
const builtinGroup = 'wheel';

/**
 * A non-builtin group, created solely so the list has something to render.
 *
 * Without it the "built-ins are hidden" assertion is unfalsifiable: `goToGroups`
 * resolves on the route activating, the rows arrive over the socket a beat
 * later, and `toBeHidden` is satisfied by an empty table. A regression that
 * stopped filtering built-ins entirely would still pass. Waiting for *this* row
 * first is what proves the list had loaded when `wheel` was found absent — and
 * it has to be a row the test made, because with built-ins hidden a stock
 * appliance's list can legitimately be empty.
 */
const anchorGroup = 'e2e_prefs_anchor';

/** What `beforeEach` wrote, and therefore exactly what `afterEach` must undo to. */
let baseline: PreferencesBlob;

test.beforeEach(async ({ api }) => {
  baseline = await establishPreferenceBaseline(api);
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and an
  // unguarded call would then write `undefined` — serialized as `null` — over
  // the attribute, on top of a failure that already has a cause worth reading.
  if (baseline) {
    await restorePreferences(api, baseline);
  }
});

test('a theme change outlives the page that made it', async ({ page, api }) => {
  await openPreferencesForm(page);
  await chooseTheme(page, testTheme.label);
  await savePreferences(page);

  await expectTheme(page, testTheme.value);

  // The appliance's own copy. Saving is a socket round trip the form does not
  // wait on, so this polls rather than reads once.
  await expect.poll(() => readPreference(api, 'userTheme')).toBe(testTheme.value);

  // The app is rebuilt and comes back on the same theme. Worth stating what this
  // does *not* prove: the theme is cached in the browser too — webui under
  // `theme` in both `localStorage` and `sessionStorage`, the library under
  // `tn-theme` — and a reload keeps all three, so this would still pass for a
  // change that never reached the appliance. The line above is what covers that,
  // and `unauthenticated/preferences-session.e2e.ts` is what proves a new
  // browser gets it from the account. Clearing the caches here instead would
  // take the session token with them.
  await page.reload();
  await expectTheme(page, testTheme.value);
});

test('a previewed theme is put back when the panel is dismissed', async ({ page, api }) => {
  // The baseline `beforeEach` wrote, so "where it started" is a place this test
  // chose rather than one it found. Reading it off the appliance instead would
  // make the test pass trivially on an account already sitting on the theme it
  // previews.
  const original = preferenceBaseline.userTheme;
  await expectTheme(page, original);

  await openPreferencesForm(page);
  await chooseTheme(page, testTheme.label);

  // Live preview, before any save — the point of the feature, and the reason
  // dismissing has something to undo.
  await expectTheme(page, testTheme.value);

  await discardPreferences(page);

  await expectTheme(page, original);
  expect(await readPreference(api, 'userTheme')).toBe(original);
});

test('syncing the theme with the OS replaces the theme picker with a pair', async ({ page, api }) => {
  const form = preferencesLocators.form;

  await openPreferencesForm(page);

  // A `@if`, so these are present-or-absent rather than enabled-or-disabled,
  // and the swap runs both ways. Asserting only one direction would pass
  // against a form that hid the single picker and never brought it back.
  await expect(page.locator(form.lightTheme)).toBeHidden();
  await page.locator(form.syncThemeWithOs).click();
  await expect(page.locator(form.theme)).toBeHidden();
  await expect(page.locator(form.lightTheme)).toBeVisible();
  await expect(page.locator(form.darkTheme)).toBeVisible();

  await page.locator(form.syncThemeWithOs).click();
  await expect(page.locator(form.theme)).toBeVisible();
  await expect(page.locator(form.lightTheme)).toBeHidden();

  await page.locator(form.syncThemeWithOs).click();
  await savePreferences(page);

  await expect.poll(() => readPreference(api, 'syncThemeWithOS')).toBe(true);
});

/**
 * Scoped to the one test that needs a row.
 *
 * At file level this cost the three theme tests six `group.*` round trips they
 * had no use for, and coupled them to an API they never touch: a `group.create`
 * that failed would have failed every preference test, reporting groups.
 */
test.describe('with a group of its own in the list', () => {
  test.beforeEach(async ({ api }) => {
    await ensureGroupAbsent(api, anchorGroup);
    await ensureGroupPresent(api, anchorGroup);
  });

  test.afterEach(async ({ api }) => {
    await ensureGroupAbsent(api, anchorGroup);
  });

  test('the groups list remembers that built-ins were shown', async ({ page, api }) => {
    // Hidden to start with because `beforeEach` put it that way — not because the
    // appliance was asked and agreed. Read back from the appliance rather than
    // asserted against the constant that was just written, which would only be
    // the test agreeing with itself.
    expect(await readPreference(api, 'hideBuiltinGroups')).toBe(true);

    await goToGroups(page);

    // The anchor first: it is what makes the next line an observation rather than
    // a race with an empty table. See the note on `anchorGroup`.
    await expect(page.locator(groupsLocators.row(anchorGroup))).toBeVisible();
    await expect(page.locator(groupsLocators.row(builtinGroup))).toBeHidden();

    await page.locator(groupsLocators.showBuiltIns).click();
    await expect(page.locator(groupsLocators.row(builtinGroup))).toBeVisible();

    await expect.poll(() => readPreference(api, 'hideBuiltinGroups')).toBe(false);

    // The reason this one is worth a test: a toggle that looks like view state is
    // account state, and it is still on for this admin on their next visit. That
    // is also what puts a newly created group on page two of a list a spec
    // expects it on page one of — recorded under Known gaps in docs/status.md.
    await page.reload();
    await expect(page.locator(groupsLocators.row(builtinGroup))).toBeVisible();
  });
});
