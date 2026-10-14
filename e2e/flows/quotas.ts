/**
 * User and group quotas on a dataset, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets } from './navigation';
import type { QuotaKind } from '../fixtures/quotas';
import { quotaLocators } from '../locators/quotas';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';

const saveTimeoutMs = 90_000;

/**
 * Selects `dataset` in the tree and opens its User Quotas or Group Quotas page from the Space
 * Management card.
 *
 * The card belongs to whatever the tree has selected, and the page lands with the pool root
 * selected, so the card's Path has to name `dataset` before the link is clicked. Otherwise the
 * link would open the root's quotas.
 *
 * Waits for Add, which the page header renders once the page is up.
 */
export async function openQuotasPage(page: Page, dataset: string, kind: QuotaKind): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(dataset));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);

  await page.locator(quotaLocators.manage(dataset, kind)).click();
  await expect(page.locator(quotaLocators.list.add)).toBeVisible();
}

/**
 * Opens Add on the quotas page and names the principal the quotas are for.
 *
 * The chips field takes free text, and Enter commits what was typed as a chip. A name that matches
 * nothing would be committed too, and then refused by the field's own existence check.
 */
export async function openAddQuotaForm(page: Page, kind: QuotaKind, name: string): Promise<void> {
  await page.locator(quotaLocators.list.add).click();

  const principals = page.locator(quotaLocators.form.principals(kind));
  await expect(principals).toBeVisible();
  await principals.fill(name);
  await principals.press('Enter');
}

/**
 * Opens Edit on `name`'s row.
 *
 * Waits for the read-only Name to hold `name`. The form patches it in only once the quota has
 * loaded, in the same step that fills both quotas, so a field changed before that would be
 * overwritten.
 */
export async function openEditQuotaForm(page: Page, kind: QuotaKind, name: string): Promise<void> {
  await page.locator(quotaLocators.list.edit(kind, name)).click();
  await expect(page.locator(quotaLocators.form.name)).toHaveValue(name);
}

/** Fills both quotas on the open add or edit form. `dataQuota` is what a person types, `1 GiB`. */
export async function fillQuotas(page: Page, quotas: { dataQuota: string; objectQuota: number }): Promise<void> {
  await page.locator(quotaLocators.form.dataQuota).fill(quotas.dataQuota);
  await page.locator(quotaLocators.form.objectQuota).fill(String(quotas.objectQuota));
}

/** Saves the open quota form and waits for the panel to close, which it does only on success. */
export async function saveQuotaForm(page: Page): Promise<void> {
  await page.locator(quotaLocators.form.save).click();
  await expect(page.locator(quotaLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
