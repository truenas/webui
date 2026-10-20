/**
 * The Apps service's pool and its settings, driven through Apps > Configuration.
 */
import { expect, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { dockerUpdateTimeoutMs } from '../fixtures/apps';
import { appsLocators, appsSettingsLocators, selectAppsPoolDialogLocators } from '../locators/apps';
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
 * Configuration > Settings, and waits for the form to load what `docker.config` holds: the first
 * address pool's base is empty until it has.
 */
export async function openAppsSettings(page: Page, firstPoolAddress: string): Promise<void> {
  await openAppsConfigMenu(page);
  await page.locator(appsLocators.settings).click();
  await expect(page.locator(appsSettingsLocators.addressPool(0).base)).toHaveValue(firstPoolAddress);
}

/**
 * Waits until the Preferred Trains boxes read `ticked` and `unticked`. The boxes come from their
 * own `catalog.trains` call and the ticks from `catalog.config`, both after the panel has opened,
 * so neither is there when `openAppsSettings` returns.
 */
export async function expectPreferredTrains(page: Page, ticked: string[], unticked: string[]): Promise<void> {
  for (const train of ticked) {
    await expect(page.locator(appsSettingsLocators.preferredTrain(train))).toBeChecked();
  }
  for (const train of unticked) {
    const box = page.locator(appsSettingsLocators.preferredTrain(train));
    await expect(box).toBeVisible();
    await expect(box).not.toBeChecked();
  }
}

/** Closes the panel without saving. It has been edited, so the panel asks first. */
export async function discardAppsSettings(page: Page): Promise<void> {
  await page.locator(appsSettingsLocators.closePanel).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(appsSettingsLocators.save)).toBeHidden();
}

/** Sets one address pool's base address, its prefix and its subnet size. */
export async function fillAddressPool(
  page: Page,
  index: number,
  pool: { address: string; prefixBits: number; size: number },
): Promise<void> {
  const row = appsSettingsLocators.addressPool(index);

  await page.locator(row.base).fill(pool.address);
  await selectOption(page, row.prefix, appsSettingsLocators.prefixOption(pool.prefixBits));
  await page.locator(row.size).fill(String(pool.size));
}

/** Adds a registry mirror at `index` and fills its URL. Insecure is left unticked. */
export async function addRegistryMirror(page: Page, index: number, url: string): Promise<void> {
  await page.locator(appsSettingsLocators.addRegistryMirror).click();
  await page.locator(appsSettingsLocators.registryMirror(index).url).fill(url);
}

/**
 * Presses Save and waits for the panel to close, which it does only once `catalog.update` and the
 * `docker.update` job have both succeeded.
 */
export async function saveAppsSettings(page: Page): Promise<void> {
  const save = page.locator(appsSettingsLocators.save);

  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeHidden({ timeout: dockerUpdateTimeoutMs });
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
