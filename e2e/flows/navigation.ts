/**
 * Getting around the app the way a user does — clicking the sidebar.
 *
 * Deliberately no `page.goto()` to feature pages. Typing a URL is not what an
 * administrator does, and jumping straight to a route skips whatever the
 * navigation itself would have exercised: that the menu entry exists, is
 * visible to this user's role, and points where it claims to. A journey that
 * deep-links past the menu cannot notice when the menu breaks.
 *
 * `page.goto()` remains correct for *entering* the app (the sign-in page), and
 * for the token setup project, neither of which a user reaches by clicking.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { navLocators } from '../locators/navigation';

/** Route each destination should land on, used to confirm arrival. */
const expectedRoute = {
  storage: /\/storage\/?$/,
  datasets: /\/datasets/,
  shares: /\/sharing/,
  users: /\/credentials\/users/,
} as const;

/**
 * Resolves a nav locator to the entry the user can actually see.
 *
 * The sidebar renders some entries more than once — the Credentials submenu
 * appears both inline and in a slide-out overlay, both carrying the same
 * `data-test`. A bare selector is therefore ambiguous, and whichever copy is
 * currently hidden cannot be clicked anyway.
 *
 * (Duplicate ids across simultaneously-rendered elements are worth fixing
 * upstream; filtering by visibility is correct regardless, since it targets
 * what the user would click.)
 */
function visibleNavLink(page: Page, locator: string): Locator {
  return page.locator(locator).filter({ visible: true }).first();
}

async function clickAndArrive(page: Page, locator: string, route: RegExp): Promise<void> {
  await visibleNavLink(page, locator).click();
  await expect(page).toHaveURL(route);
}

export async function goToStorage(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.storage, expectedRoute.storage);
}

export async function goToDatasets(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.datasets, expectedRoute.datasets);
}

export async function goToShares(page: Page): Promise<void> {
  await clickAndArrive(page, navLocators.shares, expectedRoute.shares);
}

/** Credentials is a slide-out, so reaching Users takes two clicks. */
export async function goToUsers(page: Page): Promise<void> {
  await visibleNavLink(page, navLocators.credentials).click();
  await clickAndArrive(page, navLocators.users, expectedRoute.users);
}
