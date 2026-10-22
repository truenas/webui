/**
 * Cloud sync tasks, driven through the UI from the Data Protection page and
 * from their full list.
 */
import { expect, type Page } from '@playwright/test';
import {
  confirmTaskDelete,
  confirmTaskRun,
  expandTaskListRow,
  openFullListFromCard,
} from './data-protection';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { confirmDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';

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

/**
 * Fills What and When for a pull from a folder on the remote into a local
 * directory, with a transfer mode, and names the task.
 *
 * The same order as {@link fillCloudSyncPush}, for the same reasons. Pull is
 * already the wizard's direction when it opens, and is picked anyway so the
 * flow does not depend on that.
 */
export async function fillCloudSyncPull(
  page: Page,
  {
    remoteFolder,
    path,
    transferMode,
    description,
  }: {
    remoteFolder: string;
    path: string;
    transferMode: string;
    description: string;
  },
): Promise<void> {
  const { wizard } = cloudSyncLocators;

  await selectOption(page, wizard.direction, wizard.directionOption('PULL'));
  await selectOption(page, wizard.transferMode, wizard.transferModeOption(transferMode));
  await fillExplorer(page, wizard.pathDestination, path);
  await fillExplorer(page, wizard.folderSource, remoteFolder);
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

/**
 * Opens the wizard from the card and leaves it for the full form through Advanced Options.
 *
 * The form replaces the wizard in the same panel, so its Dry Run footer action is what says the
 * swap happened: the wizard is footerless and has none.
 */
export async function openCloudSyncAdvancedForm(page: Page): Promise<void> {
  await openCloudSyncWizard(page);

  await page.locator(cloudSyncLocators.wizard.advanced).click();
  await expect(page.locator(cloudSyncLocators.form.dryRun)).toBeVisible();
}

/**
 * Fills the full form for a push from a local directory, through a credential, to a folder on the
 * remote — and a bucket, when the credential's provider has them — and names the task if given a
 * description.
 *
 * In this order because the direction decides which explorers render, the remote folder and the
 * bucket render only once a credential is picked, and the bucket's options load after that.
 */
export async function fillCloudSyncFormPush(
  page: Page,
  {
    path,
    credential,
    bucket,
    remoteFolder,
    description,
  }: {
    path: string;
    credential: { name: string; provider: string };
    bucket?: string;
    remoteFolder: string;
    description?: string;
  },
): Promise<void> {
  const { form } = cloudSyncLocators;

  await selectOption(page, form.direction, form.directionOption('PUSH'));
  await fillExplorer(page, form.pathSource, path);
  await selectOption(page, form.credential, form.credentialOption(credential.name, credential.provider));
  if (bucket !== undefined) {
    await selectOption(page, form.bucket, form.bucketOption(bucket));
  }
  await fillExplorer(page, form.folderDestination, remoteFolder);
  if (description !== undefined) {
    await page.locator(form.description).fill(description);
  }
}

/**
 * Presses the form's Dry Run and waits for its job dialog to open and then close.
 *
 * The dialog closes once `cloudsync.sync_onetime` has finished, whatever its outcome, so the
 * caller reads the job's state from the appliance. Even a one-file dry run starts rclone, which
 * keeps the dialog up for long enough to be seen open.
 */
export async function dryRunCloudSyncForm(page: Page): Promise<void> {
  const dryRun = page.locator(cloudSyncLocators.form.dryRun);

  await expect(dryRun).toBeEnabled();
  await dryRun.click();
  await expect(page.locator(jobDialogLocators.title)).toBeVisible();
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Closes the edited form without saving. The form is dirty, so the unsaved-changes question is
 * asserted rather than looked for.
 */
export async function discardCloudSyncForm(page: Page): Promise<void> {
  const { form } = cloudSyncLocators;

  await page.locator(form.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(form.save)).toBeHidden();
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

/**
 * Sets Transfers to a number of the admin's own through Custom and its dialog.
 *
 * Picking Custom is what opens the dialog. Whether its number reached the form
 * is for the spec to read back from the appliance once the form is saved.
 */
export async function chooseCloudSyncCustomTransfers(page: Page, transfers: number): Promise<void> {
  const { form, customTransfers } = cloudSyncLocators;

  await selectOption(page, form.transfers, form.transfersOption('Custom'));
  await expect(page.locator(customTransfers.title)).toBeVisible();

  await page.locator(customTransfers.transfers).fill(String(transfers));
  const save = page.locator(customTransfers.save);
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page.locator(customTransfers.title)).toBeHidden();
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
 * Picks one of a row's menu actions and answers its confirm.
 *
 * Run, Dry Run and Stop all ask first through webui's shared confirm, raised
 * with `hideCheckbox`, so there is no box to tick. The answer is a snackbar, so
 * there is nothing to close; the spec reads the outcome from the appliance and
 * the row's state.
 */
async function confirmRowAction(page: Page, description: string, action: string): Promise<void> {
  await openRowMenu(page, description);
  await page.locator(action).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/** Runs a task from its row menu. */
export async function runCloudSyncTaskFromCard(page: Page, description: string): Promise<void> {
  await confirmRowAction(page, description, cloudSyncLocators.card.rowMenuRun(description));
}

/** Starts a dry run from the row menu: the same job as Run, with `dry_run` set. */
export async function dryRunCloudSyncTaskFromCard(page: Page, description: string): Promise<void> {
  await confirmRowAction(page, description, cloudSyncLocators.card.rowMenuDryRun(description));
}

/**
 * Stops a running task from the row menu.
 *
 * The menu offers Stop only while the row's job is running, so the caller waits
 * for that first.
 */
export async function stopCloudSyncTaskFromCard(page: Page, description: string): Promise<void> {
  await confirmRowAction(page, description, cloudSyncLocators.card.rowMenuStop(description));
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

/** Opens the full list, `/data-protection/cloudsync`, from the card's title, starting from the sidebar. */
export async function openCloudSyncTaskList(page: Page): Promise<void> {
  await openFullListFromCard(page, {
    link: cloudSyncLocators.card.open,
    route: /\/data-protection\/cloudsync\/?$/,
    arrived: cloudSyncLocators.list.add,
  });
}

/** Opens a row's detail panel on the full list, starting from the sidebar, and waits for `action` in it. */
async function expandListRow(page: Page, description: string, action: string): Promise<void> {
  await openCloudSyncTaskList(page);
  await expandTaskListRow(page, cloudSyncLocators.list.description(description), action);
}

/**
 * Runs a task from its row's detail panel on the full list, and answers the confirm.
 *
 * The panel's actions are keyed by the task's id, so the caller reads it over the API first.
 */
export async function runCloudSyncTaskFromList(
  page: Page,
  { description, id }: { description: string; id: number },
): Promise<void> {
  const runNow = cloudSyncLocators.list.runNow(id);
  await expandListRow(page, description, runNow);
  await page.locator(runNow).click();
  await confirmTaskRun(page);
}

/**
 * Opens the edit form for a task from its row's detail panel on the full list.
 *
 * The list opens the card's form, so this waits on the same thing: the task's
 * description having been patched in.
 */
export async function openEditCloudSyncFormFromList(
  page: Page,
  { description, id }: { description: string; id: number },
): Promise<void> {
  const edit = cloudSyncLocators.list.edit(id);
  await expandListRow(page, description, edit);
  await page.locator(edit).click();
  await expect(page.locator(cloudSyncLocators.form.description)).toHaveValue(description);
}

/** Deletes a task from its row's detail panel on the full list, and waits for its row to go. */
export async function deleteCloudSyncTaskFromList(
  page: Page,
  { description, id }: { description: string; id: number },
): Promise<void> {
  const remove = cloudSyncLocators.list.delete(id);
  await expandListRow(page, description, remove);
  await page.locator(remove).click();
  await confirmTaskDelete(page, cloudSyncLocators.list.row(description));
}
