/**
 * Stories: an admin presses View All under a category on Apps > Discover, searches that page, and the term still
 * applies after Back to Discover Page. No pool is built: these calls answer from a catalog sync, which clones to a
 * temp directory with no pool. The category is the first with more than 6 apps (Discover shows 6 per section),
 * and expected apps come from the same call and filter the page makes. `beforeAll` syncs the catalog so no page
 * opens a first-sync dialog; nothing is changed, so nothing is torn down.
 */
import {
  readAppCategories, readAvailableAppsInCategory, syncCatalog, type CatalogAppEntry,
} from '../fixtures/apps';
import { openCategoryPage } from '../flows/catalog-apps';
import { goToApps } from '../flows/navigation';
import { appCatalogLocators } from '../locators/apps';
import { pageHeaderLocators } from '../locators/page-header';
import { expect, test } from '../support/fixtures';

/** Discover shows this many apps per section (`AppsFilterStore.appsPerCategory`). */
const appsPerSection = 6;

/** The UI's own sections, which `app.categories` does not name but which are not catalog categories. */
const extraCategories = ['recommended', 'new-and-updated', 'all'];

/** Matches no app's name, title or description. */
const unmatchedTerm = 'e2e-no-such-app';

let category = '';
let categoryApps: CatalogAppEntry[] = [];

/** How the page titles a category: dashes to spaces, then Angular's `titlecase`. */
function categoryTitle(name: string): string {
  return name
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

test.beforeAll(async ({ api }) => {
  await syncCatalog(api);

  const categories = (await readAppCategories(api)).filter((name) => !extraCategories.includes(name));
  for (const candidate of categories) {
    // One at a time on purpose: the first that qualifies is taken, and the rest are never read.
    const apps = await readAvailableAppsInCategory(api, candidate);
    if (apps.length > appsPerSection) {
      category = candidate;
      categoryApps = apps;
      break;
    }
  }

  expect(
    category,
    `no category in app.categories has more than ${appsPerSection} apps in app.available, so Discover `
    + `offers no View All. Categories read: ${categories.join(', ') || 'none'}.`,
  ).not.toBe('');
});

test.beforeEach(async ({ page }) => {
  await goToApps(page);
  await page.locator(appCatalogLocators.discoverApps).click();
});

test('View All on a category row opens a page listing every app in that category', async ({ page }) => {
  await openCategoryPage(page, category);

  await expect(page).toHaveURL(new RegExp(`/apps/available/${category}$`));
  await expect(page.locator(pageHeaderLocators.title)).toHaveText(categoryTitle(category));

  // More than the section on Discover could show, which is what View All is for.
  await expect(page.locator(appCatalogLocators.anyAppCard)).toHaveCount(categoryApps.length);
  for (const app of categoryApps) {
    await expect(page.locator(appCatalogLocators.appCard(app.train, app.name))).toBeVisible();
  }

  const misfiled = categoryApps.filter((app) => !app.categories.includes(category));
  expect(misfiled, `every app listed should be filed under "${category}"`).toEqual([]);
});

test('searching narrows the category page, and the term survives going back to Discover', async ({ page }) => {
  // The longest name is the least likely to occur in every other app's fields, so searching it narrows.
  const searched = categoryApps.reduce((longest, app) => (app.name.length > longest.name.length ? app : longest));
  const search = page.locator(appCatalogLocators.search);
  const cards = page.locator(appCatalogLocators.anyAppCard);

  await openCategoryPage(page, category);
  // The starting state the search has to change.
  await expect(cards).toHaveCount(categoryApps.length);

  await search.fill(searched.name);
  await expect(page).toHaveURL(new RegExp(`[?&]search=${searched.name}(&|$)`));
  await expect(page.locator(appCatalogLocators.appCard(searched.train, searched.name))).toBeVisible();
  // Not a count of 1: matching covers every string field, descriptions included.
  await expect.poll(
    () => cards.count(),
    { message: `searching "${searched.name}" should leave fewer than all ${categoryApps.length} cards` },
  ).toBeLessThan(categoryApps.length);

  await search.fill(unmatchedTerm);
  await expect(page.locator(appCatalogLocators.noSearchResults)).toBeVisible();
  await expect(cards).toHaveCount(0);

  await page.locator(appCatalogLocators.backToDiscover).click();
  await expect(page).toHaveURL(/\/apps\/available$/);
  // `resetFiltersKeepingSearch`: Discover's own Search box takes the term over.
  await expect(search).toHaveValue(unmatchedTerm);
});
