/**
 * Cron Jobs, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { selectOption } from './storage';
import { cronLocators } from '../locators/cron';
import { confirmDialogLocators, infoDialogLocators } from '../locators/dialogs';

/** Creating, updating, running and deleting a job are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddCronForm(page: Page): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(cronLocators.card.add).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(cronLocators.form.command)).toBeVisible();
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, command: string, user: string): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(cronLocators.card.rowMenu(command, user)).click();
}

/**
 * Opens the edit form for a job from its row menu.
 *
 * Waits on the command having been patched in, which is what says the panel is
 * editing *this* job rather than showing an empty form.
 */
export async function openEditCronForm(page: Page, command: string, user: string): Promise<void> {
  await openRowMenu(page, command, user);
  await page.locator(cronLocators.card.rowMenuEdit(command, user)).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(cronLocators.form.command)).toHaveValue(command);
}

/**
 * Picks the user a job runs as.
 *
 * The field is an autocomplete over a middleware query, so the row is not in
 * the DOM until the typed text has been sent and answered — and clicking the
 * row is what commits the value, not the text.
 */
export async function chooseCronUser(page: Page, username: string): Promise<void> {
  await page.locator(cronLocators.form.user).fill(username);
  await page.locator(cronLocators.form.userOption(username)).click();
}

/** Picks a schedule preset by its whole label — see `hourlyScheduleLabel`. */
export async function chooseCronSchedule(page: Page, label: string): Promise<void> {
  await selectOption(page, cronLocators.form.schedule, cronLocators.form.scheduleOption(label));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveCronForm(page: Page): Promise<void> {
  await page.locator(cronLocators.form.save).click();
  await expect(page.locator(cronLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Runs a job from its row menu and returns the title of the dialog that reports it.
 *
 * Run asks first through webui's shared confirm, raised with `hideCheckbox`, so
 * there is no box to tick. Its answer is an info dialog naming the job by its
 * description, which is returned for the spec to assert on and then closed.
 * Run raises no first-time warning.
 */
export async function runCronJob(page: Page, command: string, user: string): Promise<string> {
  await openRowMenu(page, command, user);
  await page.locator(cronLocators.card.rowMenuRun(command, user)).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  const title = page.locator(infoDialogLocators.title);
  await expect(title).toBeVisible({ timeout: saveTimeoutMs });
  const text = await title.innerText();
  await page.locator(infoDialogLocators.close).click();
  await expect(title).toBeHidden();

  return text;
}

/**
 * Deletes a job from its row menu, through the card's own dialog, and waits for it to go.
 *
 * Unlike the shared confirm, `CronDeleteDialog` has no box to tick: Delete is
 * live as soon as the dialog opens. Delete raises no first-time warning.
 */
export async function deleteCronJob(page: Page, command: string, user: string): Promise<void> {
  await openRowMenu(page, command, user);
  await page.locator(cronLocators.card.rowMenuDelete(command, user)).click();

  const { deleteDialog } = cronLocators;
  await expect(page.locator(deleteDialog.title)).toBeVisible();
  await page.locator(deleteDialog.confirm).click();
  await expect(page.locator(deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}
