/**
 * Rsync tasks, driven through the UI from the Data Protection page and from
 * their full list.
 */
import { expect, type Page } from '@playwright/test';
import { confirmTaskDelete, confirmTaskRun, openFullListFromCard } from './data-protection';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { rsyncKeychainConnectLabel, rsyncSshModeLabel, rsyncTaskLocators } from '../locators/rsync-tasks';

/** Creating, updating and deleting a task are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * How many tasks the card lists — its pager's `pageSize`. Sorted by path.
 *
 * The card's View All is not a way round it: the pager carries a `routerLink`
 * to the full list page, so pressing it leaves the card. The specs check up
 * front that their rows will fit instead.
 */
export const rsyncTaskCardPageSize = 4;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddRsyncTaskForm(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(rsyncTaskLocators.card.add).click();
  await expect(page.locator(rsyncTaskLocators.form.path)).toBeVisible();
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, path: string, remoteHost: string): Promise<void> {
  await goToDataProtection(page);
  await page.locator(rsyncTaskLocators.card.rowMenu(path, remoteHost)).click();
}

/**
 * Opens the edit form for a task from its row menu.
 *
 * Waits on the task's description having been patched in, which is what says
 * the panel is editing *this* task rather than showing an empty form.
 */
export async function openEditRsyncTaskForm(
  page: Page,
  { path, remoteHost, description }: { path: string; remoteHost: string; description: string },
): Promise<void> {
  await openRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.card.rowMenuEdit(path, remoteHost)).click();
  await expect(page.locator(rsyncTaskLocators.form.description)).toHaveValue(description);
}

/**
 * Types the local path and leaves the field.
 *
 * The explorer hands its value to the form when it loses focus — see
 * `fillNfsSharePath` — so a path typed and not left is not what Save sends.
 */
export async function fillRsyncTaskPath(page: Page, path: string): Promise<void> {
  const field = page.locator(rsyncTaskLocators.form.path);

  await field.fill(path);
  await field.blur();
}

/**
 * Picks the user the task runs as.
 *
 * The field is an autocomplete over a middleware query, so the row is not in
 * the DOM until the typed text has been sent and answered — and clicking the
 * row is what commits the value, not the text.
 */
export async function chooseRsyncTaskUser(page: Page, username: string): Promise<void> {
  await page.locator(rsyncTaskLocators.form.user).fill(username);
  await page.locator(rsyncTaskLocators.form.userOption(username)).click();
}

/** Picks a direction by its label, `Push` or `Pull`. */
export async function chooseRsyncTaskDirection(page: Page, label: string): Promise<void> {
  const { form } = rsyncTaskLocators;
  await selectOption(page, form.direction, form.directionOption(label));
}

/**
 * Switches the form to SSH mode, signing in through a saved SSH connection, and
 * sets the remote path.
 *
 * Each control renders only once the one before it has its value: the connect
 * mode in SSH mode, and the connection select once the keychain is picked. The
 * connection's options load from middleware, which the option click waits for.
 */
export async function connectRsyncTaskOverSsh(
  page: Page,
  { connection, remotePath }: { connection: string; remotePath: string },
): Promise<void> {
  const { form } = rsyncTaskLocators;
  await selectOption(page, form.mode, form.modeOption(rsyncSshModeLabel));
  await selectOption(page, form.sshConnectMode, form.sshConnectModeOption(rsyncKeychainConnectLabel));
  await selectOption(page, form.sshConnection, form.sshConnectionOption(connection));
  await page.locator(form.remotePath).fill(remotePath);
}

/** Picks a schedule preset by its whole label — see `hourlyScheduleLabel` in `locators/cron.ts`. */
export async function chooseRsyncTaskSchedule(page: Page, label: string): Promise<void> {
  const { form } = rsyncTaskLocators;
  await selectOption(page, form.schedule, form.scheduleOption(label));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveRsyncTaskForm(page: Page): Promise<void> {
  await page.locator(rsyncTaskLocators.form.save).click();
  await expect(page.locator(rsyncTaskLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Runs a task from its row menu.
 *
 * Run asks first through webui's shared confirm, raised with `hideCheckbox`, so
 * there is no box to tick. The answer is a snackbar, so there is nothing to
 * close; the spec reads the outcome from the appliance and the row's state.
 */
export async function runRsyncTaskFromCard(page: Page, path: string, remoteHost: string): Promise<void> {
  await openRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.card.rowMenuRun(path, remoteHost)).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Deletes a task from its row menu, and waits for its row to go.
 *
 * The card raises webui's shared confirm through `confirmDelete`, which does not
 * pass `hideCheckbox`, so Delete stays **disabled** until the box is ticked —
 * asserted on the way, so a dialog that lost its gate fails here rather than
 * passing a test that never needed it.
 */
export async function deleteRsyncTask(page: Page, path: string, remoteHost: string): Promise<void> {
  await openRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.card.rowMenuDelete(path, remoteHost)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(rsyncTaskLocators.card.row(path, remoteHost))).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens the full list, `/data-protection/rsync`, from the card's title, starting from the sidebar. */
export async function openRsyncTaskList(page: Page): Promise<void> {
  await openFullListFromCard(page, {
    link: rsyncTaskLocators.card.open,
    route: /\/data-protection\/rsync\/?$/,
    arrived: rsyncTaskLocators.list.add,
  });
}

/** Opens a row's kebab menu on the full list, starting from the sidebar. */
async function openListRowMenu(page: Page, path: string, remoteHost: string): Promise<void> {
  await openRsyncTaskList(page);
  await page.locator(rsyncTaskLocators.list.rowMenu(path, remoteHost)).click();
}

/**
 * Opens the edit form for a task from its row menu on the full list.
 *
 * The list opens the card's form, so this waits on the same thing: the task's
 * description having been patched in.
 */
export async function openEditRsyncTaskFormFromList(
  page: Page,
  { path, remoteHost, description }: { path: string; remoteHost: string; description: string },
): Promise<void> {
  await openListRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.list.rowMenuEdit(path, remoteHost)).click();
  await expect(page.locator(rsyncTaskLocators.form.description)).toHaveValue(description);
}

/** Runs a task from its row menu on the full list, and answers the confirm. */
export async function runRsyncTaskFromList(page: Page, path: string, remoteHost: string): Promise<void> {
  await openListRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.list.rowMenuRun(path, remoteHost)).click();
  await confirmTaskRun(page);
}

/** Deletes a task from its row menu on the full list, and waits for its row to go. */
export async function deleteRsyncTaskFromList(page: Page, path: string, remoteHost: string): Promise<void> {
  await openListRowMenu(page, path, remoteHost);
  await page.locator(rsyncTaskLocators.list.rowMenuDelete(path, remoteHost)).click();
  await confirmTaskDelete(page, rsyncTaskLocators.list.row(path, remoteHost));
}
