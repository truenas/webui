/**
 * Periodic snapshot tasks, driven through the UI from the Data Protection page
 * and from their full list.
 */
import { expect, type Page } from '@playwright/test';
import { confirmTaskDelete, expandTaskListRow, openFullListFromCard } from './data-protection';
import { goToDataProtection } from './navigation';
import { selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';

/** Creating, updating and deleting a task are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * How many tasks the card lists — its pager's `pageSize`. Sorted by dataset.
 *
 * The card's View All is not a way round it: the pager carries a `routerLink`
 * to the full list page, so pressing it leaves the card. The specs check up
 * front that their rows will fit instead.
 */
export const snapshotTaskCardPageSize = 4;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddSnapshotTaskForm(page: Page): Promise<void> {
  await goToDataProtection(page);

  await page.locator(snapshotTaskLocators.card.add).click();
  await expect(page.locator(snapshotTaskLocators.form.namingSchema)).toBeVisible();
}

/** Opens a row's kebab menu, starting from the sidebar. */
async function openRowMenu(page: Page, dataset: string): Promise<void> {
  await goToDataProtection(page);
  await page.locator(snapshotTaskLocators.card.rowMenu(dataset)).click();
}

/**
 * Opens the edit form for the task on a dataset from its row menu.
 *
 * Waits on the task's naming schema having been patched in, which is what says
 * the panel is editing *this* task rather than showing the add form's default.
 */
export async function openEditSnapshotTaskForm(page: Page, dataset: string, namingSchema: string): Promise<void> {
  await openRowMenu(page, dataset);
  await page.locator(snapshotTaskLocators.card.rowMenuEdit(dataset)).click();
  await expect(page.locator(snapshotTaskLocators.form.namingSchema)).toHaveValue(namingSchema);
}

export async function chooseSnapshotTaskDataset(page: Page, dataset: string): Promise<void> {
  const { form } = snapshotTaskLocators;
  await selectOption(page, form.dataset, form.datasetOption(dataset));
}

/** Picks a lifetime unit by its wire value — `DAY`, `MONTH`. */
export async function chooseSnapshotTaskLifetimeUnit(page: Page, unit: string): Promise<void> {
  const { form } = snapshotTaskLocators;
  await selectOption(page, form.lifetimeUnit, form.lifetimeUnitOption(unit));
}

/** Picks a schedule preset by its whole label — see `hourlyScheduleLabel` in `locators/cron.ts`. */
export async function chooseSnapshotTaskSchedule(page: Page, label: string): Promise<void> {
  const { form } = snapshotTaskLocators;
  await selectOption(page, form.schedule, form.scheduleOption(label));
}

/**
 * Flips the Enabled switch on the row for a dataset's task, starting from the sidebar.
 *
 * The card writes the opposite of what the row was loaded with, and the switch
 * moves on click whether or not that write lands — so the caller reads the
 * appliance to learn what happened.
 */
export async function toggleSnapshotTaskEnabled(page: Page, dataset: string): Promise<void> {
  await goToDataProtection(page);

  const toggle = page.locator(snapshotTaskLocators.card.enabledToggle(dataset));
  await expect(toggle).toBeVisible({ timeout: saveTimeoutMs });
  await toggle.click();
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveSnapshotTaskForm(page: Page): Promise<void> {
  await page.locator(snapshotTaskLocators.form.save).click();
  await expect(page.locator(snapshotTaskLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes the task on a dataset from its row menu, and waits for its row to go.
 *
 * The card asks `pool.snapshottask.delete_will_change_retention_for` first and
 * then raises webui's shared confirm without `hideCheckbox`, so Delete stays
 * **disabled** until the box is ticked — asserted on the way, so a dialog that
 * lost its gate fails here rather than passing a test that never needed it. A
 * task with no snapshots yet gets no second box, so there is nothing else to tick.
 *
 * Pass `keepSnapshots` for a task that has snapshots. The dialog then has to
 * offer to keep them with their original retention, which is asserted, and the
 * box is ticked or left alone as asked. Whether the choice reached middleware
 * is the caller's to read back.
 */
export async function deleteSnapshotTask(page: Page, dataset: string, keepSnapshots?: boolean): Promise<void> {
  await openRowMenu(page, dataset);
  await page.locator(snapshotTaskLocators.card.rowMenuDelete(dataset)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: saveTimeoutMs });

  if (keepSnapshots !== undefined) {
    const keep = page.locator(confirmDialogLocators.secondaryCheckbox);
    await expect(keep).toBeVisible();
    if (keepSnapshots) {
      await keep.click();
    }
  }

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(snapshotTaskLocators.card.row(dataset))).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens the full list, `/data-protection/snapshot`, from the card's title, starting from the sidebar. */
export async function openSnapshotTaskList(page: Page): Promise<void> {
  await openFullListFromCard(page, {
    link: snapshotTaskLocators.card.open,
    route: /\/data-protection\/snapshot\/?$/,
    arrived: snapshotTaskLocators.list.add,
  });
}

/** Opens a row's detail panel on the full list, starting from the sidebar, and waits for `action` in it. */
async function expandListRow(page: Page, dataset: string, namingSchema: string, action: string): Promise<void> {
  await openSnapshotTaskList(page);
  await expandTaskListRow(page, snapshotTaskLocators.list.dataset(dataset, namingSchema), action);
}

/**
 * Opens the edit form for a task from its row's detail panel on the full list.
 *
 * The list opens the card's form, so this waits on the same thing: the task's
 * naming schema having been patched in.
 */
export async function openEditSnapshotTaskFormFromList(
  page: Page,
  dataset: string,
  namingSchema: string,
): Promise<void> {
  const edit = snapshotTaskLocators.list.edit(dataset, namingSchema);
  await expandListRow(page, dataset, namingSchema, edit);
  await page.locator(edit).click();
  await expect(page.locator(snapshotTaskLocators.form.namingSchema)).toHaveValue(namingSchema);
}

/**
 * Deletes a task from its row's detail panel on the full list, and waits for its row to go.
 *
 * For a task with no snapshots yet, so the confirm offers no second box. The
 * list asks middleware whether there are any before it opens the confirm, which
 * is why the confirm can take a moment to appear.
 */
export async function deleteSnapshotTaskFromList(page: Page, dataset: string, namingSchema: string): Promise<void> {
  const remove = snapshotTaskLocators.list.delete(dataset, namingSchema);
  await expandListRow(page, dataset, namingSchema, remove);
  await page.locator(remove).click();
  await confirmTaskDelete(page, snapshotTaskLocators.list.row(dataset, namingSchema));
}
