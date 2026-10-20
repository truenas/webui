/**
 * Global search, opened from the topbar.
 *
 * Like the alerts and jobs panels it is not a page: it opens over whatever the
 * test is looking at, so these flows start from wherever the test already is.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { globalSearchLocators } from '../locators/global-search';

/**
 * The search box a user types into. While search is open that is the overlay's
 * copy; the topbar's, under it, is hidden. See `locators/global-search.ts`.
 */
export function globalSearchInput(page: Page): Locator {
  return page.locator(globalSearchLocators.input).filter({ visible: true });
}

/**
 * Waits for search to be open: the overlay's box is attached beside the
 * topbar's, and has taken focus, which is where a user's typing goes.
 */
export async function expectGlobalSearchOpen(page: Page): Promise<void> {
  await expect(page.locator(globalSearchLocators.input)).toHaveCount(2);
  await expect(globalSearchInput(page)).toBeFocused();
}

/** Waits for the overlay to have gone, leaving only the topbar's box. */
export async function expectGlobalSearchClosed(page: Page): Promise<void> {
  await expect(page.locator(globalSearchLocators.input)).toHaveCount(1);
}

/** Opens search by clicking the topbar's "Search UI" box. */
export async function openGlobalSearch(page: Page): Promise<void> {
  await globalSearchInput(page).click();
  await expectGlobalSearchOpen(page);
}

/**
 * Types a term into the open search box. Results arrive after a debounce, so
 * the caller waits on the result it expects rather than on this.
 */
export async function searchFor(page: Page, term: string): Promise<void> {
  await globalSearchInput(page).fill(term);
}
