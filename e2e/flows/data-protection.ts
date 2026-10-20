/**
 * The Data Protection dashboard as a whole: the way from each task card to its
 * full list, the Enabled switch every card's rows share, and what the full
 * lists share once there — their search, and the confirms their Run and
 * Delete raise.
 *
 * What one card or one list does on its own — adding, editing, running a task —
 * lives in that task's flow module.
 */
import { expect, type Page } from '@playwright/test';
import { goToDashboard, goToDataProtection } from './navigation';
import { taskListLocators } from '../locators/data-protection';
import { confirmDialogLocators } from '../locators/dialogs';

/** How long a freshly loaded card has to render the row's switch. The write itself is the caller's to wait on. */
const toggleTimeoutMs = 60_000;

/** Deleting a task is a middleware call, and the list reloads after it. */
const deleteTimeoutMs = 60_000;

/** Where a card's link leads, and what says the page it leads to has rendered. */
export interface FullListLink {
  /** The card's own control: its title, or its pager's View All. */
  link: string;
  route: RegExp;
  /** A control on the full list page — its page header's Add. */
  arrived: string;
}

/**
 * Follows a card's link to its full list, starting from the sidebar.
 *
 * Both the title and View All change the route, so arriving is a URL, and the
 * list page's own control is what says it has rendered.
 */
export async function openFullListFromCard(page: Page, { link, route, arrived }: FullListLink): Promise<void> {
  await goToDataProtection(page);

  await page.locator(link).click();
  await expect(page).toHaveURL(route);
  await expect(page.locator(arrived)).toBeVisible();
}

/**
 * Flips the Enabled switch on a card row, on a freshly loaded Data Protection page.
 *
 * The card writes the opposite of what the row was loaded with, and the switch
 * moves on click whether or not that write lands — so the caller reads the
 * appliance to learn what happened. Going by way of the Dashboard loads every
 * card again, so a second flip of the same row is written from what the
 * appliance holds after the first, not from a row still waiting on its reload.
 */
export async function toggleCardTaskEnabled(page: Page, toggleSelector: string): Promise<void> {
  await goToDashboard(page);
  await goToDataProtection(page);

  const toggle = page.locator(toggleSelector);
  await expect(toggle).toBeVisible({ timeout: toggleTimeoutMs });
  await toggle.click();
}

/**
 * Types into the search box of the full list that is open.
 *
 * Each list filters on columns of its own choosing (a replication task's name,
 * a rsync task's path and description), so the caller picks a query one of
 * those columns holds.
 */
export async function searchTaskList(page: Page, query: string): Promise<void> {
  await page.locator(taskListLocators.search).fill(query);
}

/**
 * Opens a row's detail panel on the full list that is open, and waits for one
 * of its actions.
 *
 * Replication, cloud sync and periodic snapshot lists keep a row's actions in
 * that panel rather than on the row, and so does the cron jobs list. Clicking
 * anywhere on the row opens it, on a table that sets `expandOnRowClick`. The
 * caller passes a text cell to click, because a replication row also holds its
 * Enabled switch, and a click on the switch writes to the task.
 */
export async function expandTaskListRow(page: Page, cell: string, action: string): Promise<void> {
  await page.locator(cell).click();
  await expect(page.locator(action)).toBeVisible();
}

/**
 * Answers the confirm that a list's Run raises.
 *
 * Every list raises webui's shared confirm with `hideCheckbox`, so there is no
 * box to tick. The answer is a snackbar, so there is nothing to close, and the
 * caller reads the outcome from the appliance.
 */
export async function confirmTaskRun(page: Page): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/**
 * Answers the confirm that a list's Delete raises, and waits for the row to go.
 *
 * None of the lists passes `hideCheckbox`, so Delete stays **disabled** until
 * the box is ticked. That is asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it. A periodic
 * snapshot task with snapshots also gets a second box, which this leaves alone.
 */
export async function confirmTaskDelete(page: Page, row: string): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: deleteTimeoutMs });

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(row)).toBeHidden({ timeout: deleteTimeoutMs });
}
