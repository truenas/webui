/**
 * Installed apps: deleting one from its Application Info card.
 */
import { expect, type Page } from '@playwright/test';
import { appDeleteDialogLocators, installedAppLocators } from '../locators/apps';

/**
 * Selects the app's row, presses Delete on its Application Info card and confirms with the app's
 * name. Remove Images is ticked by default and is left that way, so the images go too. The dialog
 * closes before the `app.delete` job runs; the caller waits on the row.
 */
export async function deleteInstalledApp(page: Page, name: string): Promise<void> {
  const app = installedAppLocators(name);

  await page.locator(app.name).click();
  await page.locator(app.delete).click();

  await expect(page.locator(appDeleteDialogLocators.title)).toBeVisible();
  await page.locator(appDeleteDialogLocators.confirmName).fill(name);
  await expect(page.locator(appDeleteDialogLocators.removeImages)).toBeChecked();
  await page.locator(appDeleteDialogLocators.delete).click();
}
