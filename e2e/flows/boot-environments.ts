/**
 * Boot environments, driven through the UI from System > Boot.
 */
import { expect, type Page } from '@playwright/test';
import { goToBootEnvironments } from './navigation';
import { bootEnvironmentLocators } from '../locators/boot-environments';
import { confirmDialogLocators } from '../locators/dialogs';

const { list, cloneForm, deleteDialog } = bootEnvironmentLocators;

/** Cloning, setting keep and deleting all write to the boot pool before the page hears back. */
const saveTimeoutMs = 60_000;

/**
 * Opens the clone form from a boot environment's row, starting from the sidebar.
 *
 * Waits on Source holding that name, which is what says the panel is cloning
 * *this* boot environment rather than another row's.
 */
export async function openCloneForm(page: Page, source: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.clone(source)).click();
  await expect(page.locator(cloneForm.source)).toHaveValue(source);
}

/**
 * Saves the clone form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a refusal
 * leaves it open with the error attached.
 */
export async function saveCloneForm(page: Page): Promise<void> {
  await page.locator(cloneForm.save).click();
  await expect(page.locator(cloneForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Sets a boot environment's keep flag from its row, through webui's shared
 * confirm, and waits for the row to say so.
 *
 * The confirm is raised without `hideCheckbox`, so its button stays **disabled**
 * until the box is ticked — asserted on the way, as `flows/tunable.ts` does. The
 * list reloads only once the call returns, so the Keep cell is what is waited on.
 */
export async function keepBootEnvironment(page: Page, name: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.keepAction(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(list.keep(name))).toHaveText('Yes', { timeout: saveTimeoutMs });
}

/**
 * Deletes a boot environment from its row and waits for the row to go.
 *
 * The page's own dialog rather than the shared confirm: it lists what it is
 * about to delete, which is checked to be this one boot environment, and its
 * Delete stays disabled until Confirm is ticked. The delete runs as a
 * `core.bulk` job; with one item the dialog closes on success and the list reloads.
 */
export async function deleteBootEnvironment(page: Page, name: string): Promise<void> {
  await goToBootEnvironments(page);
  await page.locator(list.delete(name)).click();
  await expect(page.locator(deleteDialog.title)).toBeVisible();
  await expect(page.locator(deleteDialog.item(name))).toBeVisible();

  const confirm = page.locator(deleteDialog.delete);
  await expect(confirm).toBeDisabled();
  await page.locator(deleteDialog.confirm).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(list.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
