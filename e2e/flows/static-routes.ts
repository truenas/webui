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

/**
 * How many routes the card lists before View All — its pager's `pageSize`.
 * Sorted by destination, so which route is the first one hidden depends on what
 * else the appliance holds.
 */
export const staticRouteCardPageSize = 4;

/**
 * Presses View All on a freshly loaded card when the appliance holds more
 * routes than it lists, so every row is in the DOM.
 *
 * The caller passes the count, read over the API, because whether View All
 * renders at all depends on it, and probing the page for the button would race
 * the card's load. Expanded, the card lists as many rows as it held at the click,
 * which stays enough for an edit or a delete: neither adds a route.
 */
async function showAllStaticRoutes(page: Page, total: number): Promise<void> {
  if (total <= staticRouteCardPageSize) {
    return;
  }

  await page.locator(staticRouteLocators.card.viewAll).click();
  await expect(page.locator(staticRouteLocators.card.collapse)).toBeVisible();
}

/** Opens the add form from the card, starting from the sidebar. */
export async function openAddStaticRouteForm(page: Page): Promise<void> {
  await goToNetwork(page);

  await page.locator(staticRouteLocators.card.add).click();
  await expect(page.locator(staticRouteLocators.form.destination)).toBeVisible();
}

/**
 * Opens the edit form for a route from its row, starting from the sidebar.
 * `total` is how many routes the appliance holds — see {@link showAllStaticRoutes}.
 *
 * Waits on the gateway having been patched in, which is what says the panel is
 * editing *this* route rather than showing an empty form.
 */
export async function openEditStaticRouteForm(page: Page, key: StaticRouteRowKey, total: number): Promise<void> {
  await goToNetwork(page);
  await showAllStaticRoutes(page, total);

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
 * its row to go. `total` is how many routes the appliance holds, the target
 * included — see {@link showAllStaticRoutes}.
 *
 * Unlike the shared confirm, `StaticRouteDeleteDialog` has no box to tick:
 * Delete is live as soon as the dialog opens. The card reloads only once the
 * delete has returned and the dialog closed, so the row is what is waited on.
 */
export async function deleteStaticRoute(page: Page, key: StaticRouteRowKey, total: number): Promise<void> {
  await goToNetwork(page);
  await showAllStaticRoutes(page, total);
  await page.locator(staticRouteLocators.card.delete(key)).click();

  const { deleteDialog } = staticRouteLocators;
  await expect(page.locator(deleteDialog.title)).toBeVisible();
  await page.locator(deleteDialog.confirm).click();
  await expect(page.locator(deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(staticRouteLocators.card.row(key))).toBeHidden({ timeout: saveTimeoutMs });
}
