/**
 * Acting on the controls `tn-table` draws on a row. See `locators/table.ts` for
 * how their ids are built.
 */
import { expect, type Page } from '@playwright/test';
import { tableLocators } from '../locators/table';

/** Ticks a row's selection box, and waits for it to read as ticked. */
export async function selectRow(page: Page, rowTag: string): Promise<void> {
  const box = page.locator(tableLocators.selectRow(rowTag));
  await box.check();
  await expect(box).toBeChecked();
}

/** Clears a row's selection box, and waits for it to read as clear. */
export async function deselectRow(page: Page, rowTag: string): Promise<void> {
  const box = page.locator(tableLocators.selectRow(rowTag));
  await box.uncheck();
  await expect(box).not.toBeChecked();
}

/**
 * Expands a row by its chevron, and waits for the chevron to report it open.
 *
 * The chevron toggles, so this is only for a row that is collapsed. A table with
 * `[singleExpand]` collapses whichever row was open before.
 */
export async function expandRow(page: Page, rowTag: string): Promise<void> {
  const chevron = page.locator(tableLocators.expandRow(rowTag));
  await expect(chevron).toHaveAttribute('aria-expanded', 'false');
  await chevron.click();
  await expect(chevron).toHaveAttribute('aria-expanded', 'true');
}
