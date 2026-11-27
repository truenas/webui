/**
 * Story: an admin collapses the side menu to its icons (on this desktop layout, hiding each label) and expands it
 * with Cmd/Ctrl+B, which the topbar's menu button names in its tooltip. It is ignored in a text field or with a
 * dialog or side panel open; each of those presses is followed by one after leaving, which collapses the menu
 * only if the first changed nothing. Collapsed is the account's `sidenavStatus` preference, read at sign-in, so
 * each test starts expanded and puts it back.
 */
import {
  establishPreferenceBaseline, readPreference, restorePreferences,
} from '../fixtures/preferences';
import type { PreferencesBlob } from '../fixtures/preferences';
import { goToGroups } from '../flows/navigation';
import { openPreferencesForm } from '../flows/preferences';
import { generalSettingsLocators } from '../locators/general-settings';
import { groupsLocators } from '../locators/groups';
import { navLocators } from '../locators/navigation';
import { preferencesLocators } from '../locators/preferences';
import { topbarLocators } from '../locators/topbar';
import { expect, test } from '../support/fixtures';

/** The shortcut, in Playwright's notation: Meta on macOS, Control elsewhere. */
const toggleSidenavShortcut = 'ControlOrMeta+B';

/** An expanded side menu, the state every test starts from. */
const expandedSidenav = { isCollapsed: false, isOpen: true, mode: 'side' };

/** What `beforeEach` wrote, and therefore exactly what `afterEach` must undo to. */
let baseline: PreferencesBlob;

test.beforeEach(async ({ api }) => {
  // Before `page` signs in, so the menu renders expanded from the start.
  baseline = { ...await establishPreferenceBaseline(api), sidenavStatus: expandedSidenav };
  await restorePreferences(api, baseline);
});

test.afterEach(async ({ api }) => {
  // Guarded: an unguarded call after a failed `beforeEach` would write `null` over the attribute.
  if (baseline) {
    await restorePreferences(api, baseline);
  }
});

test('Ctrl+B collapses the side menu, and pressing it again expands it', async ({ page, api }) => {
  const label = page.locator(navLocators.dashboardLabel);
  await expect(label).toBeVisible();

  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeHidden();
  await expect(page.locator(navLocators.dashboard)).toBeVisible();
  await expect.poll(() => readPreference(api, 'sidenavStatus')).toMatchObject({ isCollapsed: true });

  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeVisible();
  await expect.poll(() => readPreference(api, 'sidenavStatus')).toMatchObject({ isCollapsed: false });
});

test('Ctrl+B does nothing while typing in a text field', async ({ page }) => {
  const label = page.locator(navLocators.dashboardLabel);
  const search = page.locator(groupsLocators.search);

  await goToGroups(page);
  await search.click();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeVisible();
  await expect(search).toBeFocused();

  await search.blur();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeHidden();
});

test('Ctrl+B does nothing while a dialog is open', async ({ page }) => {
  const label = page.locator(navLocators.dashboardLabel);
  const { feedbackDialog } = generalSettingsLocators;

  await page.locator(topbarLocators.leaveFeedback).click();
  await expect(page.locator(feedbackDialog.title)).toBeVisible();
  // Off any text field the dialog may have focused, so the open dialog is the only reason to ignore the key.
  await page.locator(feedbackDialog.close).focus();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeVisible();

  // Closed through the shell's own ✕; nothing in the dialog is ever sent.
  await page.locator(feedbackDialog.close).click();
  await expect(page.locator(feedbackDialog.title)).toBeHidden();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeHidden();
});

test('Ctrl+B does nothing while a side panel is open', async ({ page }) => {
  const label = page.locator(navLocators.dashboardLabel);
  const { form } = preferencesLocators;

  await openPreferencesForm(page);
  // Off any field the panel may have focused, as in the dialog test above.
  await page.locator(form.close).focus();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeVisible();

  // Nothing was changed, so the panel closes without asking to discard anything.
  await page.locator(form.close).click();
  await expect(page.locator(form.save)).toBeHidden();
  await page.keyboard.press(toggleSidenavShortcut);

  await expect(label).toBeHidden();
});

test('the menu button tooltip names the shortcut', async ({ page }) => {
  const toggle = page.locator(topbarLocators.toggleSidenav);

  await toggle.hover();

  // The tooltip panel carries no `data-test`, and the library describes the button with the same message, so the
  // button's description is what is read. ⌘ is shown on a macOS user agent, Ctrl on any other.
  await expect(toggle).toHaveAccessibleDescription(/^Toggle Collapse \((Ctrl|⌘) \+ B\)$/);
});
