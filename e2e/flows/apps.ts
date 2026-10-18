/**
 * The Apps service's pool, driven through Apps > Configuration.
 */
import { expect, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { dockerUpdateTimeoutMs } from '../fixtures/apps';
import { appsLocators, selectAppsPoolDialogLocators } from '../locators/apps';
import { confirmDialogLocators } from '../locators/dialogs';

/** Opens the Configuration menu on the installed apps page. Choose Pool is in it for any admin. */
export async function openAppsConfigMenu(page: Page): Promise<void> {
  await page.locator(appsLocators.configMenu).click();
  await expect(page.locator(appsLocators.choosePool)).toBeVisible();
}

/**
 * Configuration > Choose Pool, picks `pool` and presses Choose.
 *
 * The dialog stays open until `docker.update` has finished, behind the job progress dialog it
 * raises, so its closing is the job's success. A failed job leaves it open under an error dialog.
 */
export async function chooseAppsPool(page: Page, pool: string): Promise<void> {
  await openAppsConfigMenu(page);
  await page.locator(appsLocators.choosePool).click();
  await expect(page.locator(selectAppsPoolDialogLocators.title)).toBeVisible();

  await selectOption(page, selectAppsPoolDialogLocators.pool, selectAppsPoolDialogLocators.poolOption(pool));
  await page.locator(selectAppsPoolDialogLocators.choose).click();

  await expect(page.locator(selectAppsPoolDialogLocators.title)).toBeHidden({ timeout: dockerUpdateTimeoutMs });
}

/**
 * Configuration > Unset Pool, and confirms. The confirmation is raised with `hideCheckbox`, so there
 * is no box to tick. What follows is a job progress dialog and then a snackbar, so there is nothing
 * to close; the caller waits on the status.
 */
export async function unsetAppsPool(page: Page): Promise<void> {
  await openAppsConfigMenu(page);
  await page.locator(appsLocators.unsetPool).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
}
