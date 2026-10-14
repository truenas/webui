/**
 * The Services page under System, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToServices } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { servicesLocators, type ServiceKey } from '../locators/services';

/** How long a service may take to start or stop. A job, not a call. */
export const serviceChangeTimeoutMs = 90_000;

/** Saving rewrites the service's configuration, and restarts it if it is running. */
const saveTimeoutMs = 60_000;

/**
 * Starts a stopped service from its row's play button.
 *
 * Waits for the row to say Stopped first. The page reads the services from the
 * store, and the button it renders is decided by the state the row holds, so a
 * click before the row has loaded can land on nothing.
 */
export async function startServiceFromList(page: Page, service: ServiceKey): Promise<void> {
  await expect(page.locator(servicesLocators.row.status(service))).toContainText('Stopped');
  await page.locator(servicesLocators.row.start(service)).click();
}

/** Stops a running service from its row's stop button, confirming the dialog that raises. */
export async function stopServiceFromList(page: Page, service: ServiceKey): Promise<void> {
  await page.locator(servicesLocators.row.stop(service)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
}

/**
 * Opens a service's form from the pencil on its row, starting from the sidebar.
 *
 * `loadedField` and `loadedValue` name a field and the value the appliance holds
 * for it. The form fills itself from the API after it opens, so editing before
 * that value appears could type into a field the load then overwrites.
 */
export async function openServiceForm(
  page: Page,
  service: ServiceKey,
  loadedField: string,
  loadedValue: string,
): Promise<void> {
  await goToServices(page);
  await page.locator(servicesLocators.row.edit(service)).click();
  await expect(page.locator(loadedField)).toHaveValue(loadedValue);
}

/**
 * Saves the open form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveServiceForm(page: Page): Promise<void> {
  await page.locator(servicesLocators.save).click();
  await expect(page.locator(servicesLocators.save)).toBeHidden({ timeout: saveTimeoutMs });
}
