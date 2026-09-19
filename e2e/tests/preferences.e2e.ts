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
 * ## Why the teardown is unusual
 *
 * Preferences hang off the account the whole suite signs in as, so a test that
 * leaves one behind changes what every later test sees — a date format changes
 * the text in every date cell, a language translates the app. There is nothing
 * to delete, so `afterEach` puts the snapshot back whole rather than undoing a
 * field. See `fixtures/preferences.ts`.
 */
import { readPreference, readPreferences, restorePreferences } from '../fixtures/preferences';
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
 * The account's preferences as this test found them, restored afterwards.
 *
 * Read per test rather than once for the file: `beforeEach` in a suite that
 * restores in `afterEach` always sees the original, and a shared snapshot would
 * quietly become "whatever the first test happened to observe" if one ever
 * failed mid-change.
 */
let snapshot: PreferencesBlob;

test.beforeEach(async ({ api }) => {
  snapshot = await readPreferences(api);
});

test.afterEach(async ({ api }) => {
  await restorePreferences(api, snapshot);
});

test('a theme change outlives the page that made it', async ({ page, api }) => {
  await openPreferencesForm(page);
  await chooseTheme(page, testTheme.label);
  await savePreferences(page);

  await expectTheme(page, testTheme.value);

  // The appliance's own copy. Saving is a socket round trip the form does not
  // wait on, so this polls rather than reads once.
  await expect.poll(() => readPreference(api, 'userTheme')).toBe(testTheme.value);

  // And the part a store-only change would fail: the app is rebuilt from
  // scratch and still comes back in the chosen theme.
  await page.reload();
  await expectTheme(page, testTheme.value);
});

test('a previewed theme is put back when the panel is dismissed', async ({ page, api }) => {
  // Whatever the account was already on, not a literal: this test is about a
  // value returning to where it started, so hardcoding the start would make it
  // a different test on an appliance configured differently.
  const original = snapshot.userTheme as string;
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

test('the groups list remembers that built-ins were shown', async ({ page, api }) => {
  // Hidden by default, which is why the groups specs never see a built-in row —
  // and why a reader of those specs would not guess this is a *preference*
  // rather than a per-visit toggle.
  expect(snapshot.hideBuiltinGroups).toBe(true);

  await goToGroups(page);
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
