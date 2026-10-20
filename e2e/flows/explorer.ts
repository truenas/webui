/**
 * Browsing an explorer's popup instead of typing a path into the field.
 *
 * Every other flow types into an explorer and leaves the field, which hands the
 * text to the form without asking the explorer's provider anything. Browsing is
 * what makes the explorer call its provider, once per directory opened. The
 * entry names are what the provider listed, so a test that finds one has read
 * that listing.
 *
 * `base` is the explorer's id base — see `locators/explorer.ts`.
 */
import { expect, type Page } from '@playwright/test';
import { explorerLocators } from '../locators/explorer';

/**
 * How long one directory may take to list. A remote one is a round trip to
 * another system: an SFTP listing, or a dataset list over SSH.
 */
export const explorerListingTimeoutMs = 30_000;

/**
 * Opens the popup from the toggle beside the field, and waits for `firstEntry`
 * to be listed at the root.
 */
export async function openExplorer(page: Page, base: string, firstEntry: string): Promise<void> {
  await page.locator(explorerLocators.toggle(base)).click();
  await expect(page.locator(explorerLocators.entry(base, firstEntry))).toBeVisible({
    timeout: explorerListingTimeoutMs,
  });
}

/**
 * Opens the directory `name`, which the open directory lists, and waits for the
 * popup to show its path ending in `name`.
 */
export async function openExplorerDirectory(page: Page, base: string, name: string): Promise<void> {
  await page.locator(explorerLocators.open(base, name)).click();
  await expect(page.locator(explorerLocators.breadcrumb(base, name))).toBeVisible({
    timeout: explorerListingTimeoutMs,
  });
}

/**
 * Picks `name` in the open directory and presses Select, which closes the popup.
 *
 * A multiple explorer is picked by its tick box, a single one by clicking the
 * entry. Select stays disabled until something is picked.
 */
export async function pickExplorerEntry(
  page: Page,
  base: string,
  name: string,
  { multiple }: { multiple: boolean },
): Promise<void> {
  if (multiple) {
    const tick = page.locator(explorerLocators.entryCheckbox(base, name));
    await tick.click();
    await expect(tick).toBeChecked();
  } else {
    await page.locator(explorerLocators.entry(base, name)).click();
  }

  const select = page.locator(explorerLocators.select(base));
  await expect(select).toBeEnabled();
  await select.click();
  await expect(select).toBeHidden();
}
