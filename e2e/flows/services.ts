/**
 * The Services page under System, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToServices } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { servicesLocators, type ServiceKey } from '../locators/services';

/** How long a service may take to start or stop. A job, not a call. */
export const serviceChangeTimeoutMs = 90_000;

/**
 * Saving rewrites the service's configuration, and restarts it if it is running.
 * Also how long a refusal may take to come back from middleware.
 */
export const serviceSaveTimeoutMs = 60_000;

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
 * {@link openServiceForm} for a form whose loaded value shows as text rather
 * than as an input's value, such as the label a `tn-select` trigger displays.
 */
export async function openServiceFormShowing(
  page: Page,
  service: ServiceKey,
  loadedField: string,
  loadedText: string,
): Promise<void> {
  await goToServices(page);
  await page.locator(servicesLocators.row.edit(service)).click();
  await expect(page.locator(loadedField)).toHaveText(loadedText);
}

/**
 * Opens a service's form like {@link openServiceForm}, for a baseline in which
 * every field the form fills in is empty or matches its default, so no value
 * can say the load has landed.
 *
 * Waits for Save instead: the form holds it disabled while the service's config
 * loads, and enables it once every control has been patched.
 */
export async function openServiceFormOnceLoaded(page: Page, service: ServiceKey): Promise<void> {
  await goToServices(page);
  await page.locator(servicesLocators.row.edit(service)).click();
  await expect(page.locator(servicesLocators.save)).toBeEnabled({ timeout: serviceSaveTimeoutMs });
}

/**
 * Reveals the open form's advanced fields from the footer toggle, and waits for
 * `advancedField`, one of them, to render. A toggle that did nothing hides the
 * whole section, so this is where that fails rather than on the first click.
 */
export async function showAdvancedSettings(page: Page, advancedField: string): Promise<void> {
  await page.locator(servicesLocators.advancedToggle).click();
  await expect(page.locator(advancedField)).toBeVisible();
}

/**
 * Clicks each of these labels in the open SSH form's Weak Ciphers select. A
 * click toggles a cipher, so this both picks and drops.
 *
 * The select is multiple, so its panel stays open between clicks. Escape closes
 * it, and would close the side panel too if the select had not taken the key,
 * so Save is asserted still there afterwards.
 */
export async function toggleWeakCiphers(page: Page, labels: [string, ...string[]]): Promise<void> {
  const form = servicesLocators.sshForm;
  await page.locator(form.weakCiphers).click();

  for (const label of labels) {
    await page.locator(form.weakCiphersOption(label)).click();
  }

  await page.keyboard.press('Escape');
  await expect(page.locator(form.weakCiphersOption(labels[0]))).toBeHidden();
  await expect(page.locator(servicesLocators.save)).toBeVisible();
}

/**
 * Saves the open form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveServiceForm(page: Page): Promise<void> {
  await page.locator(servicesLocators.save).click();
  await expect(page.locator(servicesLocators.save)).toBeHidden({ timeout: serviceSaveTimeoutMs });
}
