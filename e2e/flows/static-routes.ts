/**
 * Static routes, driven through the UI from System > Network.
 *
 * The Network page raises no first-time warning in front of the form, so
 * nothing here waits for one.
 */
import { expect, type Page } from '@playwright/test';
import { goToNetwork } from './navigation';
import { staticRouteLocators, type StaticRouteRowKey } from '../locators/static-routes';

/**
 * Creating, updating and deleting a route are middleware calls that restart
 * the routing service, not instant.
 */
const saveTimeoutMs = 60_000;

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddStaticRouteForm(page: Page): Promise<void> {
  await goToNetwork(page);

  await page.locator(staticRouteLocators.card.add).click();
  await expect(page.locator(staticRouteLocators.form.destination)).toBeVisible();
}

/**
 * Opens the edit form for a route from its row, starting from the sidebar.
 *
 * Waits on the gateway having been patched in, which is what says the panel is
 * editing *this* route rather than showing an empty form.
 */
export async function openEditStaticRouteForm(page: Page, key: StaticRouteRowKey): Promise<void> {
  await goToNetwork(page);

  await page.locator(staticRouteLocators.card.edit(key)).click();
  await expect(page.locator(staticRouteLocators.form.gateway)).toHaveValue(key.gateway);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveStaticRouteForm(page: Page): Promise<void> {
  await page.locator(staticRouteLocators.form.save).click();
  await expect(page.locator(staticRouteLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a route from its row, through the card's own dialog, and waits for
 * its row to go.
 *
 * Unlike the shared confirm, `StaticRouteDeleteDialog` has no box to tick:
 * Delete is live as soon as the dialog opens. The card reloads only once the
 * delete has returned and the dialog closed, so the row is what is waited on.
 */
export async function deleteStaticRoute(page: Page, key: StaticRouteRowKey): Promise<void> {
  await goToNetwork(page);
  await page.locator(staticRouteLocators.card.delete(key)).click();

  const { deleteDialog } = staticRouteLocators;
  await expect(page.locator(deleteDialog.title)).toBeVisible();
  await page.locator(deleteDialog.confirm).click();
  await expect(page.locator(deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(staticRouteLocators.card.row(key))).toBeHidden({ timeout: saveTimeoutMs });
}
