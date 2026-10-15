/**
 * TrueCloud Backup tasks, driven through the UI from the Data Protection page.
 */
import { expect, type Page } from '@playwright/test';
import { goToDataProtection } from './navigation';
import { cloudBackupLocators } from '../locators/cloud-backup';

/** Opens the add form from the card, starting from the sidebar. */
export async function openCloudBackupForm(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(cloudBackupLocators.card.add).click();
  await expect(page.locator(cloudBackupLocators.form.description)).toBeVisible();
}

/**
 * Opens the full list from the card's title, starting from the sidebar.
 *
 * The title is a `routerLink`, so arriving is a route change, and the page's own
 * Add is what says it has rendered.
 */
export async function openCloudBackupList(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(cloudBackupLocators.card.open).click();
  await expect(page).toHaveURL(/\/data-protection\/cloud-backup\/?$/);
  await expect(page.locator(cloudBackupLocators.list.add)).toBeVisible();
}

/**
 * Types into a field, empties it again and leaves it.
 *
 * A required field reports nothing until it has been touched, so this is what a
 * person who skips it does: the validator then has an empty, touched control to
 * refuse.
 */
export async function leaveFieldEmpty(page: Page, selector: string): Promise<void> {
  const field = page.locator(selector);

  await field.fill('1');
  await field.fill('');
  await field.blur();
}
