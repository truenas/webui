/**
 * API keys, driven through the UI from Credentials > Users.
 *
 * The API Keys page has no entry in the sidebar. A user reaches it from a
 * user's Access card ("View API Keys") or from the topbar's "My API Keys", and
 * both arrive with the list filtered to one account. The flows take the card,
 * because it names the account the journey is about rather than whoever is
 * signed in.
 */
import { expect, type Page } from '@playwright/test';
import { goToUsers } from './navigation';
import { confirmDestructiveAction } from './storage';
import { apiKeyLocators } from '../locators/api-keys';
import { confirmDialogLocators } from '../locators/dialogs';
import { usersLocators } from '../locators/users';

/** Creating and deleting a key are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/**
 * Opens the API Keys page for one user, from the Users list.
 *
 * Selecting the row first is what puts that user's Access card on screen, and
 * the card offers "View API Keys" only to a user who already holds a key.
 */
export async function openUserApiKeys(page: Page, username: string): Promise<void> {
  await goToUsers(page);

  await page.locator(usersLocators.row(username)).click();
  await page.locator(usersLocators.viewApiKeys(username)).click();
  await expect(page).toHaveURL(/\/credentials\/users\/api-keys/);
}

/**
 * Adds a non-expiring key for a user from the open API Keys page, and returns
 * the key the one-time dialog showed.
 *
 * The username field opens on the signed-in admin, so picking the account is
 * part of the journey rather than a formality: a form that ignored the pick
 * would make the key for the wrong user without failing anything else here.
 *
 * Non-expiring is the default, and the date input's absence is asserted so a
 * default that flipped would fail here rather than hand middleware a date
 * nobody chose.
 */
export async function createApiKey(page: Page, key: { name: string; username: string }): Promise<string> {
  const { form, keyCreatedDialog } = apiKeyLocators;

  await page.locator(apiKeyLocators.add).click();
  await expect(page.locator(form.name)).toBeVisible();
  await page.locator(form.name).fill(key.name);

  // An autocomplete over a middleware query: the row is not in the DOM until
  // the typed text has been answered, and clicking it is what commits the value.
  await page.locator(form.username).fill(key.username);
  await page.locator(form.usernameOption(key.username)).click();

  await expect(page.locator(form.nonExpiring)).toBeVisible();
  await expect(page.locator(form.expiresAt)).toBeHidden();

  await page.locator(form.save).click();

  // The key is shown here once and never again, so it is read before closing.
  await expect(page.locator(keyCreatedDialog.title)).toBeVisible({ timeout: saveTimeoutMs });
  const shown = await page.locator(keyCreatedDialog.key).inputValue();

  await page.locator(keyCreatedDialog.close).click();
  await expect(page.locator(keyCreatedDialog.title)).toBeHidden();

  return shown;
}

/**
 * Deletes a key from its row on the open API Keys page.
 *
 * `confirmDelete` raises the standard dialog with its tick box, so the
 * destructive-action helper applies; the row going is the app's own signal
 * that the delete went through.
 */
export async function deleteApiKey(page: Page, name: string): Promise<void> {
  await page.locator(apiKeyLocators.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);

  await expect(page.locator(confirmDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(apiKeyLocators.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
