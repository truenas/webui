/**
 * Replication tasks, driven through the UI from the Data Protection page and
 * from their full list.
 */
import { expect, type Download, type Page } from '@playwright/test';
import {
  confirmTaskDelete,
  confirmTaskRun,
  expandTaskListRow,
  openFullListFromCard,
} from './data-protection';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators, infoDialogLocators } from '../locators/dialogs';
import { replicationTaskLocators } from '../locators/replication-tasks';

/**
 * Saving the wizard is several middleware calls in a row — count the eligible
 * snapshots, take one, create the task, start it — before anything closes.
 */
const saveTimeoutMs = 90_000;

/** Updating and deleting a task are one middleware call each, not instant. */
const editTimeoutMs = 60_000;

/**
 * How many tasks the card lists — its pager's `pageSize`. Sorted by name.
 *
 * The card's View All is not a way round it: the pager carries a `routerLink`
 * to the full list page, so pressing it leaves the card. The specs check up
 * front that their rows will fit instead.
 */
export const replicationTaskCardPageSize = 4;

/** Opens the wizard from the card, starting from the sidebar. */
export async function openReplicationWizard(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(replicationTaskLocators.card.add).click();
  await expect(page.locator(replicationTaskLocators.wizard.sourceFrom)).toBeVisible();
}

/**
 * Types a path into one of the wizard's explorers and leaves the field.
 *
 * The explorer hands typed text to the form when it loses focus — see
 * `fillNfsSharePath` — and stores it verbatim. The wizard's explorers work in
 * dataset names (`pool/child`), not mount paths.
 */
async function fillExplorer(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector);

  await field.fill(value);
  await field.blur();
}

/**
 * Fills What and Where from a dataset on this appliance, names the task, and
 * moves on to When. `chooseTarget` picks where the target is, and leaves its
 * explorer showing.
 *
 * In this order because each "from" select clears the field below it when it
 * changes, and the name is regenerated from the source and target whenever
 * either changes.
 *
 * The target is chosen before the source is typed. Once there is a source path
 * the wizard counts its snapshots, and choosing a different system enables SSH
 * transport before an SSH connection is picked. Any count sent in that gap is
 * refused with "You should pass SSH credentials", and the error stays on the
 * source field. With no source yet, no count is sent.
 */
async function fillWhatAndWhere(
  page: Page,
  { source, target, name }: { source: string; target: string; name: string },
  chooseTarget: () => Promise<void>,
): Promise<void> {
  const { wizard } = replicationTaskLocators;

  await selectOption(page, wizard.sourceFrom, wizard.sourceFromThisSystem);
  await chooseTarget();
  await fillExplorer(page, wizard.sourceDatasets, source);
  await fillExplorer(page, wizard.targetDataset, target);
  await page.locator(wizard.name).fill(name);

  // Disabled until the step is valid, which is the first thing to fail if a
  // typed path did not reach the form.
  await expect(page.locator(wizard.next)).toBeEnabled();
  await page.locator(wizard.next).click();
  await expect(page.locator(wizard.runOnce)).toBeVisible();
}

/** Fills What and Where for a replication from one dataset on this appliance to another. */
export async function fillLocalReplication(
  page: Page,
  values: { source: string; target: string; name: string },
): Promise<void> {
  const { wizard } = replicationTaskLocators;

  await fillWhatAndWhere(page, values, async () => {
    await selectOption(page, wizard.targetFrom, wizard.targetFromThisSystem);
  });
}

/**
 * Fills What and Where for a push from a dataset on this appliance to one on a
 * different system, reached through the SSH connection named `connection`.
 *
 * The transport is left at the wizard's default, encrypted SSH. A connection
 * that signs in as root raises no sudo prompt, so there is none to answer.
 */
export async function fillRemoteReplication(
  page: Page,
  { connection, ...values }: { source: string; target: string; name: string; connection: string },
): Promise<void> {
  const { wizard } = replicationTaskLocators;

  await fillWhatAndWhere(page, values, async () => {
    await selectOption(page, wizard.targetFrom, wizard.targetFromDifferentSystem);
    await selectOption(page, wizard.sshConnection, wizard.sshConnectionOption(connection));
  });
}

/**
 * Picks Run Once, saves, and returns the title of the dialog that reports the start.
 *
 * Run Once saves the task and then starts it, and the wizard reports that in an
 * info dialog. The panel only closes once that dialog does, so it is closed here
 * and the panel waited out after it.
 */
export async function saveReplicationToRunOnce(page: Page): Promise<string> {
  const { wizard } = replicationTaskLocators;

  await page.locator(wizard.runOnce).click();
  await page.locator(wizard.save).click();

  const title = page.locator(infoDialogLocators.title);
  await expect(title).toBeVisible({ timeout: saveTimeoutMs });
  const text = await title.innerText();
  await page.locator(infoDialogLocators.close).click();
  await expect(title).toBeHidden();
  await expect(page.locator(wizard.save)).toBeHidden();

  return text;
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, name: string): Promise<void> {
  await goToDataProtection(page);
  await page.locator(replicationTaskLocators.card.rowMenu(name)).click();
}

/**
 * Runs a task from its row menu.
 *
 * Run asks first through webui's shared confirm, raised with `hideCheckbox`, so
 * there is no box to tick. Unlike a cron job's, the answer is a snackbar rather
 * than a dialog, so there is nothing to close; the spec reads the outcome from
 * the appliance.
 */
export async function runReplicationTask(page: Page, name: string): Promise<void> {
  await openRowMenu(page, name);
  await page.locator(replicationTaskLocators.card.rowMenuRun(name)).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Restores from a task through its row menu: names the reverse task, picks
 * where the data goes, and waits for the dialog to close.
 *
 * Restore only creates the reverse task, disabled and unscheduled; it runs
 * nothing. The dialog closing is the app's signal that the create succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function restoreReplicationTask(
  page: Page,
  name: string,
  { restoredName, destination }: { restoredName: string; destination: string },
): Promise<void> {
  const { restore } = replicationTaskLocators;

  await openRowMenu(page, name);
  await page.locator(replicationTaskLocators.card.rowMenuRestore(name)).click();
  await expect(page.locator(restore.title)).toBeVisible();

  await page.locator(restore.name).fill(restoredName);
  await fillExplorer(page, restore.destination, destination);

  const confirm = page.locator(restore.restore);
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator(restore.title)).toBeHidden({ timeout: editTimeoutMs });
}

/**
 * Downloads a task's encryption keys from its row menu, and returns the download.
 *
 * The app asks middleware to prepare the file as a job, fetches it, and hands it
 * to the browser as a blob, so the download starts some calls after the click.
 */
export async function downloadReplicationTaskKeys(page: Page, name: string): Promise<Download> {
  await openRowMenu(page, name);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: editTimeoutMs }),
    page.locator(replicationTaskLocators.card.rowMenuDownloadKeys(name)).click(),
  ]);

  return download;
}

/**
 * Opens the edit form for a task from its row menu.
 *
 * Waits on the task's name having been patched in, which is what says the panel
 * is editing *this* task rather than showing an empty form.
 */
export async function openEditReplicationTaskForm(page: Page, name: string): Promise<void> {
  await openRowMenu(page, name);
  await page.locator(replicationTaskLocators.card.rowMenuEdit(name)).click();
  await expect(page.locator(replicationTaskLocators.form.name)).toHaveValue(name);
}

/** Picks a destination read-only policy by its label, `SET`, `REQUIRE` or `IGNORE`. */
export async function chooseReplicationReadonlyPolicy(page: Page, label: string): Promise<void> {
  const { form } = replicationTaskLocators;
  await selectOption(page, form.readonly, form.readonlyOption(label));
}

/**
 * Saves the edit form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveReplicationTaskForm(page: Page): Promise<void> {
  await page.locator(replicationTaskLocators.form.save).click();
  await expect(page.locator(replicationTaskLocators.form.save)).toBeHidden({ timeout: editTimeoutMs });
}

/**
 * Deletes a task from its row menu, and waits for its row to go.
 *
 * The card raises webui's shared confirm through `confirmDelete`, which does not
 * pass `hideCheckbox`, so Delete stays **disabled** until the box is ticked —
 * asserted on the way, so a dialog that lost its gate fails here rather than
 * passing a test that never needed it.
 */
export async function deleteReplicationTask(page: Page, name: string): Promise<void> {
  await openRowMenu(page, name);
  await page.locator(replicationTaskLocators.card.rowMenuDelete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(replicationTaskLocators.card.row(name))).toBeHidden({ timeout: editTimeoutMs });
}

/** Opens the full list, `/data-protection/replication`, from the card's title, starting from the sidebar. */
export async function openReplicationTaskList(page: Page): Promise<void> {
  await openFullListFromCard(page, {
    link: replicationTaskLocators.card.open,
    route: /\/data-protection\/replication\/?$/,
    arrived: replicationTaskLocators.list.add,
  });
}

/** Opens a row's detail panel on the full list, starting from the sidebar, and waits for `action` in it. */
async function expandListRow(page: Page, name: string, action: string): Promise<void> {
  await openReplicationTaskList(page);
  await expandTaskListRow(page, replicationTaskLocators.list.name(name), action);
}

/**
 * Runs a task from its row's detail panel on the full list, and answers the confirm.
 *
 * The panel's actions are keyed by the task's id, so the caller reads it over the API first.
 */
export async function runReplicationTaskFromList(
  page: Page,
  { name, id }: { name: string; id: number },
): Promise<void> {
  const runNow = replicationTaskLocators.list.runNow(id);
  await expandListRow(page, name, runNow);
  await page.locator(runNow).click();
  await confirmTaskRun(page);
}

/**
 * Opens the edit form for a task from its row's detail panel on the full list.
 *
 * The list opens the card's form, so this waits on the same thing: the task's
 * name having been patched in.
 */
export async function openEditReplicationTaskFormFromList(
  page: Page,
  { name, id }: { name: string; id: number },
): Promise<void> {
  const edit = replicationTaskLocators.list.edit(id);
  await expandListRow(page, name, edit);
  await page.locator(edit).click();
  await expect(page.locator(replicationTaskLocators.form.name)).toHaveValue(name);
}

/** Deletes a task from its row's detail panel on the full list, and waits for its row to go. */
export async function deleteReplicationTaskFromList(
  page: Page,
  { name, id }: { name: string; id: number },
): Promise<void> {
  const remove = replicationTaskLocators.list.delete(id);
  await expandListRow(page, name, remove);
  await page.locator(remove).click();
  await confirmTaskDelete(page, replicationTaskLocators.list.row(name));
}

/**
 * Flips the Enabled switch on a row of the full list, on a freshly loaded list.
 *
 * The list writes the opposite of what the row was loaded with, so going back
 * to the list through the sidebar each time is what makes a second flip write
 * from what the appliance holds after the first. The caller reads the appliance
 * to learn what happened.
 */
export async function toggleReplicationTaskEnabledInList(page: Page, name: string): Promise<void> {
  await openReplicationTaskList(page);

  const toggle = page.locator(replicationTaskLocators.list.enabledToggle(name));
  await expect(toggle).toBeVisible({ timeout: editTimeoutMs });
  await toggle.click();
}
