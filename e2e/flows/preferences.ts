/**
 * The Preferences form, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { confirmDialogLocators } from '../locators/dialogs';
import { preferencesLocators, themeClass } from '../locators/preferences';
import { topbarLocators } from '../locators/topbar';

/** Saving dispatches to the store and writes back over the socket. */
const saveTimeoutMs = 30_000;

/**
 * Opens the Preferences panel from the user menu, as a user would.
 *
 * No sidebar hop: Preferences is not a page. It lives behind the topbar's
 * account menu, which is why this flow starts from wherever the test already
 * is rather than navigating anywhere.
 */
export async function openPreferencesForm(page: Page): Promise<void> {
  await page.locator(topbarLocators.userMenu).click();
  await page.locator(topbarLocators.preferences).click();

  // The theme select, not the panel: the panel frame is up before the form
  // inside it has its options, and a click on an empty select opens nothing.
  await expect(page.locator(preferencesLocators.form.theme)).toBeVisible();
}

/** Picks a theme by the label shown in the select. */
export async function chooseTheme(page: Page, label: string): Promise<void> {
  await page.locator(preferencesLocators.form.theme).click();
  await page.locator(preferencesLocators.form.themeOption(label)).click();
}

/**
 * Picks a language by the label its option shows, e.g. `Deutsch (de)`.
 *
 * An autocomplete: typing narrows the list to the row, and clicking the row is
 * what commits the value, not the text.
 */
export async function chooseLanguage(page: Page, label: string): Promise<void> {
  await page.locator(preferencesLocators.form.language).fill(label);
  await page.locator(preferencesLocators.form.languageOption(label)).click();
}

/**
 * Picks a date format by the label its option shows — see {@link monthDayYearLabel}.
 *
 * `.first()` because two formats can share an id. The note on `dateFormatOption`
 * in `locators/preferences.ts` explains when, and why the first is the right one.
 */
export async function chooseDateFormat(page: Page, label: string): Promise<void> {
  await page.locator(preferencesLocators.form.dateFormat).click();
  await page.locator(preferencesLocators.form.dateFormatOption(label)).first().click();
}

/**
 * The label the form gives the `MM/dd/yyyy` date format: today in that format, in
 * the appliance's timezone, e.g. `10/13/2026`.
 *
 * The form builds its labels when it opens, so this has to be called close to
 * then. A run that crosses midnight in the appliance's timezone between the two
 * looks for tomorrow's label and fails at the click.
 */
export function monthDayYearLabel(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((each) => each.type === type)?.value ?? '';

  return `${part('month')}/${part('day')}/${part('year')}`;
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that it took the change.
 *
 * Waits on **Save**, not on the theme select. The select lives inside the
 * `!isSyncWithOs()` branch of the template, so a caller that saves with
 * "Sync Theme With OS" ticked has already made it disappear — and the wait would
 * pass instantly, against a panel still open and a save still in flight. Save is
 * the one control present in both branches.
 */
export async function savePreferences(page: Page): Promise<void> {
  const save = page.locator(preferencesLocators.form.save);

  await save.click();
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Closes the panel without saving, discarding the changes.
 *
 * A dirty form raises the unsaved-changes confirmation on the way out, so
 * leaving is two steps rather than one — and the confirmation is the *point* of
 * the flow rather than an obstacle to it: dismissing the panel any other way
 * would not exercise the path that rolls a previewed theme back.
 */
export async function discardPreferences(page: Page): Promise<void> {
  await page.locator(preferencesLocators.form.close).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(preferencesLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Asserts which theme the document is currently showing. */
export async function expectTheme(page: Page, theme: string): Promise<void> {
  await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${themeClass(theme)}\\b`));
}
