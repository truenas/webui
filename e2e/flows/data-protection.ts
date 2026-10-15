/**
 * The Data Protection dashboard as a whole: the way from each task card to its
 * full list, and the Enabled switch every card's rows share.
 *
 * What one card does on its own — adding, editing, running a task — lives in
 * that card's flow module.
 */
import { expect, type Page } from '@playwright/test';
import { goToDashboard, goToDataProtection } from './navigation';

/** How long a freshly loaded card has to render the row's switch. The write itself is the caller's to wait on. */
const toggleTimeoutMs = 60_000;

/** Where a card's link leads, and what says the page it leads to has rendered. */
export interface FullListLink {
  /** The card's own control: its title, or its pager's View All. */
  link: string;
  route: RegExp;
  /** A control on the full list page — its page header's Add. */
  arrived: string;
}

/**
 * Follows a card's link to its full list, starting from the sidebar.
 *
 * Both the title and View All change the route, so arriving is a URL, and the
 * list page's own control is what says it has rendered.
 */
export async function openFullListFromCard(page: Page, { link, route, arrived }: FullListLink): Promise<void> {
  await goToDataProtection(page);

  await page.locator(link).click();
  await expect(page).toHaveURL(route);
  await expect(page.locator(arrived)).toBeVisible();
}

/**
 * Flips the Enabled switch on a card row, on a freshly loaded Data Protection page.
 *
 * The card writes the opposite of what the row was loaded with, and the switch
 * moves on click whether or not that write lands — so the caller reads the
 * appliance to learn what happened. Going by way of the Dashboard loads every
 * card again, so a second flip of the same row is written from what the
 * appliance holds after the first, not from a row still waiting on its reload.
 */
export async function toggleCardTaskEnabled(page: Page, toggleSelector: string): Promise<void> {
  await goToDashboard(page);
  await goToDataProtection(page);

  const toggle = page.locator(toggleSelector);
  await expect(toggle).toBeVisible({ timeout: toggleTimeoutMs });
  await toggle.click();
}
