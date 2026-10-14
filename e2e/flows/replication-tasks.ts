/**
 * Replication tasks, driven through the UI from the Data Protection page.
 */
import { expect, type Page } from '@playwright/test';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators, infoDialogLocators } from '../locators/dialogs';
import { replicationTaskLocators } from '../locators/replication-tasks';

/**
 * Saving the wizard is several middleware calls in a row — count the eligible
 * snapshots, take one, create the task, start it — before anything closes.
 */
const saveTimeoutMs = 90_000;

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
 * Fills What and Where for a replication from one dataset on this appliance to
 * another, names the task, and moves on to When.
 *
 * In this order because each "from" select clears the field below it when it
 * changes, and the name is regenerated from the source and target whenever
 * either changes.
 */
export async function fillLocalReplication(
  page: Page,
  { source, target, name }: { source: string; target: string; name: string },
): Promise<void> {
  const { wizard } = replicationTaskLocators;

  await selectOption(page, wizard.sourceFrom, wizard.sourceFromThisSystem);
  await fillExplorer(page, wizard.sourceDatasets, source);
  await selectOption(page, wizard.targetFrom, wizard.targetFromThisSystem);
  await fillExplorer(page, wizard.targetDataset, target);
  await page.locator(wizard.name).fill(name);

  // Disabled until the step is valid, which is the first thing to fail if a
  // typed path did not reach the form.
  await expect(page.locator(wizard.next)).toBeEnabled();
  await page.locator(wizard.next).click();
  await expect(page.locator(wizard.runOnce)).toBeVisible();
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

/**
 * Runs a task from its row menu.
 *
 * Run asks first through webui's shared confirm, raised with `hideCheckbox`, so
 * there is no box to tick. Unlike a cron job's, the answer is a snackbar rather
 * than a dialog, so there is nothing to close; the spec reads the outcome from
 * the appliance.
 */
export async function runReplicationTask(page: Page, name: string): Promise<void> {
  const { card } = replicationTaskLocators;

  await goToDataProtection(page);
  await page.locator(card.rowMenu(name)).click();
  await page.locator(card.rowMenuRun(name)).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}
