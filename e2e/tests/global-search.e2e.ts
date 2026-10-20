/**
 * Story: an admin finds pages and settings through the topbar's global search
 * rather than the sidebar, comes back to them through Recent Searches, and is
 * offered the documentation for a term the UI has nothing for.
 *
 * Search reads a static index of the app's pages and settings, filtered by the
 * signed-in user's roles; every test searches as the suite's full admin, who
 * sees all of it. Nothing here changes the appliance. The one piece of state
 * search keeps is Recent Searches, in the browser's `localStorage` under
 * `recentSearches`, so that is what each test resets.
 *
 * The keyboard shortcut is Ctrl+/ (⌘/ on macOS), the hint the topbar box
 * shows. A bare `/` does nothing.
 */
import { readTimezone } from '../fixtures/localization';
import { readSystemIdentity } from '../fixtures/system-info';
import {
  expectGlobalSearchClosed, expectGlobalSearchOpen, openGlobalSearch, searchFor,
} from '../flows/global-search';
import { goToGeneralSettings } from '../flows/navigation';
import { globalSearchLocators } from '../locators/global-search';
import { localizationLocators } from '../locators/localization';
import { servicesLocators } from '../locators/services';
import { expect, test } from '../support/fixtures';

/** A page, and the term that finds it. Its index entry has no required role. */
const servicesPage = { term: 'Services', hierarchy: ['System', 'Services'] } as const;

/** A setting on System > General Settings, and the term that finds it. */
const timezoneSetting = {
  term: 'Timezone',
  hierarchy: ['System', 'General Settings', 'Localization', 'Timezone'],
} as const;

/** Letters no page, setting or synonym in the index comes near, so UI lists nothing. */
const unmatchedTerm = 'xqzvjkw';

/** The Help result offered for any term that is not one of the documentation keywords. */
const searchDocumentationFor = (term: string): string[] => [`Search Documentation for «${term}»`];

/**
 * The documentation search a Help result opens, as `getHelpSectionResults`
 * builds it: keyed on the appliance's major version, which `extractVersion`
 * reads as the first run of digits in `system.info`'s version string. A copy of
 * both on purpose — the URL has no other source to read it from.
 */
function documentationSearchUrl(version: string, term: string): string {
  const major = /(\d+)(?:\.\d+)*/.exec(version)?.[1];
  const base = major ? `https://www.truenas.com/docs/scale/${major}/search` : 'https://www.truenas.com/docs/search';
  return `${base}/?query=${term}`;
}

/** The debounce, one pass over a few hundred index entries, and a render. */
const resultsTimeoutMs = 10_000;

/** A route change and the page's first render. */
const landingTimeoutMs = 30_000;

test.beforeEach(async ({ page }) => {
  // Bare global rather than `window.*`: this callback is serialized and runs in
  // the page, where the lint rule's advice (inject Angular's WINDOW) has nothing
  // to refer to.
  await page.evaluate(() => localStorage.removeItem('recentSearches'));
});

test('typing the name of a page lists it under UI, and choosing it opens that page', async ({ page }) => {
  const { section, result } = globalSearchLocators;

  await openGlobalSearch(page);
  await searchFor(page, servicesPage.term);

  await expect(page.locator(result(servicesPage.hierarchy))).toBeVisible({ timeout: resultsTimeoutMs });
  await expect(page.locator(section.ui)).toBeVisible();

  await page.locator(result(servicesPage.hierarchy)).click();

  await expect(page).toHaveURL(/\/system\/services\/?$/, { timeout: landingTimeoutMs });
  await expect(page.locator(servicesLocators.row.row('ssh'))).toBeVisible({ timeout: landingTimeoutMs });
  await expectGlobalSearchClosed(page);
});

test('choosing a setting from search lands on the page holding it', async ({ page, api }) => {
  const timezone = await readTimezone(api);

  await openGlobalSearch(page);
  await searchFor(page, timezoneSetting.term);
  await page.locator(globalSearchLocators.result(timezoneSetting.hierarchy)).click({ timeout: resultsTimeoutMs });

  await expect(page).toHaveURL(/\/system\/general\/?$/, { timeout: landingTimeoutMs });
  await expect(page.locator(localizationLocators.card.timezone)).toHaveText(timezone, { timeout: landingTimeoutMs });
  await expectGlobalSearchClosed(page);
});

test('Ctrl+/ opens search from any page', async ({ page }) => {
  // Sign-in lands on the Dashboard.
  await page.keyboard.press('ControlOrMeta+/');
  await expectGlobalSearchOpen(page);

  await page.keyboard.press('Escape');
  await expectGlobalSearchClosed(page);

  await goToGeneralSettings(page);
  await page.keyboard.press('ControlOrMeta+/');
  await expectGlobalSearchOpen(page);
});

test('a chosen result is under Recent Searches the next time search opens, until it is removed', async ({ page }) => {
  const { section, result, removeRecentSearch } = globalSearchLocators;

  await openGlobalSearch(page);
  await searchFor(page, servicesPage.term);
  await page.locator(result(servicesPage.hierarchy)).click({ timeout: resultsTimeoutMs });
  await expect(page).toHaveURL(/\/system\/services\/?$/, { timeout: landingTimeoutMs });
  await expectGlobalSearchClosed(page);

  // Opened with nothing typed, search lists only what was chosen before.
  await openGlobalSearch(page);
  await expect(page.locator(section.recentSearches)).toBeVisible();
  await expect(page.locator(result(servicesPage.hierarchy))).toBeVisible();

  await page.locator(removeRecentSearch(servicesPage.hierarchy)).click();

  await expect(page.locator(result(servicesPage.hierarchy))).toBeHidden();
  // It was the only one, so the section goes with it.
  await expect(page.locator(section.recentSearches)).toBeHidden();
  const stored = await page.evaluate(() => localStorage.getItem('recentSearches'));
  expect(JSON.parse(stored ?? '[]')).toEqual([]);
});

test('a term matching nothing shows an empty UI section and offers a documentation search', async ({ page, api }) => {
  const { section, result, anyResult } = globalSearchLocators;
  const { version } = await readSystemIdentity(api);
  const expectedUrl = documentationSearchUrl(version, unmatchedTerm);

  // The result opens the documentation in a new tab. Answer that tab here, so
  // the test reads where it was sent without depending on, or reaching, the
  // public site.
  await page.context().route('https://www.truenas.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '',
  }));

  await openGlobalSearch(page);
  await searchFor(page, unmatchedTerm);

  const help = page.locator(result(searchDocumentationFor(unmatchedTerm)));
  await expect(help).toBeVisible({ timeout: resultsTimeoutMs });
  await expect(page.locator(section.help)).toBeVisible();
  // UI is still listed, with nothing under it: the Help entry is the only result.
  await expect(page.locator(section.ui)).toBeVisible();
  await expect(page.locator(anyResult)).toHaveCount(1);

  const opened = page.waitForEvent('popup');
  await help.click();
  const docs = await opened;

  await expect(docs).toHaveURL(expectedUrl);
  await docs.close();
});
