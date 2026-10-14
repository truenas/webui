/**
 * Cloud sync tasks, driven through the UI from the Data Protection page.
 */
import { expect, type Page } from '@playwright/test';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { confirmDialogLocators } from '../locators/dialogs';

/** Creating, updating, restoring and deleting a task are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * How many tasks the card lists — its pager's `pageSize`. Sorted by description.
 *
 * The card's View All is not a way round it: the pager carries a `routerLink`
 * to the full list page, so pressing it leaves the card. The specs check up
 * front that their rows will fit instead.
 */
export const cloudSyncCardPageSize = 4;

/** Opens the wizard from the card, starting from the sidebar. */
export async function openCloudSyncWizard(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(cloudSyncLocators.card.add).click();
  await expect(page.locator(cloudSyncLocators.wizard.credential)).toBeVisible();
}

/**
 * Types a path into one of the explorers and leaves the field.
 *
 * The explorer hands typed text to the form when it loses focus — see
 * `fillNfsSharePath` — and stores it verbatim.
 */
async function fillExplorer(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector);

  await field.fill(value);
  await field.blur();
}

/**
 * Picks a credential on the Provider step and moves on to What and When.
 *
 * Next stays disabled until the pick has landed, which is the first thing to
 * fail if the option was not the one clicked.
 */
export async function chooseCloudSyncCredential(page: Page, name: string, provider: string): Promise<void> {
  const { wizard } = cloudSyncLocators;

  await selectOption(page, wizard.credential, wizard.credentialOption(name, provider));
  await expect(page.locator(wizard.next)).toBeEnabled();
  await page.locator(wizard.next).click();
  await expect(page.locator(wizard.direction)).toBeVisible();
}

/**
 * Fills What and When for a push from a local directory to a folder on the
 * remote, and names the task.
 *
 * In this order because the direction decides which explorers render, the
 * remote folder renders only once the credential has reached the step, and the
 * description is regenerated from the path until it has been typed into.
 */
export async function fillCloudSyncPush(
  page: Page,
  { path, remoteFolder, description }: { path: string; remoteFolder: string; description: string },
): Promise<void> {
  const { wizard } = cloudSyncLocators;

  await selectOption(page, wizard.direction, wizard.directionOption('PUSH'));
  await fillExplorer(page, wizard.pathSource, path);
  await fillExplorer(page, wizard.folderDestination, remoteFolder);
  await page.locator(wizard.description).fill(description);
}

/** Picks a schedule preset in the wizard by its whole label — see `hourlyScheduleLabel` in `locators/cron.ts`. */
export async function chooseCloudSyncWizardSchedule(page: Page, label: string): Promise<void> {
  const { wizard } = cloudSyncLocators;
  await selectOption(page, wizard.schedule, wizard.scheduleOption(label));
}

/**
 * Saves the wizard and waits for the panel to close.
 *
 * Save is disabled while the step is invalid, so it is checked first: a typed
 * path that never reached the form fails here, by name, rather than as a
 * click that did nothing.
 */
export async function saveCloudSyncWizard(page: Page): Promise<void> {
  const save = page.locator(cloudSyncLocators.wizard.save);

  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, description: string): Promise<void> {
  await goToDataProtection(page);
  await page.locator(cloudSyncLocators.card.rowMenu(description)).click();
}

/**
 * Opens the edit form for a task from its row menu.
 *
 * Waits on the task's description having been patched in, which is what says
 * the panel is editing *this* task rather than showing an empty form.
 */
export async function openEditCloudSyncForm(page: Page, description: string): Promise<void> {
  await openRowMenu(page, description);
  await page.locator(cloudSyncLocators.card.rowMenuEdit(description)).click();
  await expect(page.locator(cloudSyncLocators.form.description)).toHaveValue(description);
}

/** Picks a transfer mode in the edit form by its label, `SYNC`, `COPY` or `MOVE`. */
export async function chooseCloudSyncTransferMode(page: Page, label: string): Promise<void> {
  const { form } = cloudSyncLocators;
  await selectOption(page, form.transferMode, form.transferModeOption(label));
}

/** Picks a schedule preset in the edit form by its whole label. */
export async function chooseCloudSyncFormSchedule(page: Page, label: string): Promise<void> {
  const { form } = cloudSyncLocators;
  await selectOption(page, form.schedule, form.scheduleOption(label));
}

/**
 * Saves the edit form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveCloudSyncForm(page: Page): Promise<void> {
  await page.locator(cloudSyncLocators.form.save).click();
  await expect(page.locator(cloudSyncLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Runs a task from its row menu.
 *
 * Run asks first through webui's shared confirm, raised with `hideCheckbox`, so
 * there is no box to tick. The answer is a snackbar, so there is nothing to
 * close; the spec reads the outcome from the appliance and the row's state.
 */
export async function runCloudSyncTaskFromCard(page: Page, description: string): Promise<void> {
  await openRowMenu(page, description);
  await page.locator(cloudSyncLocators.card.rowMenuRun(description)).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Restores a task from its row menu into a local directory, under a new
 * description, and waits for the dialog to close.
 *
 * The dialog closes only once `cloudsync.restore` has answered, and stays open
 * with the error on the form if it refused. Transfer Mode is left at its
 * default, COPY.
 */
export async function restoreCloudSyncTask(
  page: Page,
  { description, restoredDescription, path }: { description: string; restoredDescription: string; path: string },
): Promise<void> {
  const { card, restore } = cloudSyncLocators;

  await openRowMenu(page, description);
  await page.locator(card.rowMenuRestore(description)).click();
  await expect(page.locator(restore.title)).toBeVisible();

  await page.locator(restore.description).fill(restoredDescription);
  await fillExplorer(page, restore.path, path);

  const confirm = page.locator(restore.restore);
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator(restore.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a task from its row menu, and waits for its row to go.
 *
 * The card raises webui's shared confirm through `confirmDelete`, which does not
 * pass `hideCheckbox`, so Delete stays **disabled** until the box is ticked —
 * asserted on the way, so a dialog that lost its gate fails here rather than
 * passing a test that never needed it.
 */
export async function deleteCloudSyncTask(page: Page, description: string): Promise<void> {
  await openRowMenu(page, description);
  await page.locator(cloudSyncLocators.card.rowMenuDelete(description)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(cloudSyncLocators.card.row(description))).toBeHidden({ timeout: saveTimeoutMs });
}
