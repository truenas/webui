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
import { fillDateInput } from './s3';
import { confirmDestructiveAction } from './storage';
import { apiKeyLocators } from '../locators/api-keys';
import { confirmDialogLocators } from '../locators/dialogs';
import { usersLocators } from '../locators/users';

/** Creating, editing and deleting a key are middleware calls, not instant. */
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
  const { form } = apiKeyLocators;

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

  return readKeyCreatedDialog(page);
}

/**
 * Reads the key off the one-time dialog a create or a reset raises, and closes
 * it. The key is shown there once and never again, so it is read first.
 */
async function readKeyCreatedDialog(page: Page): Promise<string> {
  const { keyCreatedDialog } = apiKeyLocators;

  await expect(page.locator(keyCreatedDialog.title)).toBeVisible({ timeout: saveTimeoutMs });
  const shown = await page.locator(keyCreatedDialog.key).inputValue();

  await page.locator(keyCreatedDialog.close).click();
  await expect(page.locator(keyCreatedDialog.title)).toBeHidden();

  return shown;
}

/** What an edit changes. A field left out is left as the form opened it. */
export interface ApiKeyChanges {
  name?: string;
  reset?: boolean;
  /** A date to expire on, or null to make the key non-expiring again. */
  expiresOn?: Date | null;
}

/**
 * Opens a key's Edit form from its row, makes the changes and presses Save.
 * Returns once Save is pressed; what follows depends on the change.
 *
 * Name holding the key's name is the signal the form has been filled from the
 * row, so a change typed before that cannot be overwritten by it.
 *
 * Each expiry change is confirmed by the date input appearing or going, so a
 * Non-expiring box that started the other way fails here rather than
 * toggling the wrong way.
 */
export async function submitApiKeyEdit(page: Page, name: string, changes: ApiKeyChanges): Promise<void> {
  const { form } = apiKeyLocators;

  await page.locator(apiKeyLocators.edit(name)).click();
  await expect(page.locator(form.name)).toHaveValue(name);

  if (changes.name !== undefined) {
    await page.locator(form.name).fill(changes.name);
  }

  if (changes.expiresOn === null) {
    await expect(page.locator(form.expiresAt)).toBeVisible();
    await page.locator(form.nonExpiring).click();
    await expect(page.locator(form.expiresAt)).toBeHidden();
  } else if (changes.expiresOn) {
    await expect(page.locator(form.expiresAt)).toBeHidden();
    await page.locator(form.nonExpiring).click();
    await expect(page.locator(form.expiresAt)).toBeVisible();
    await fillDateInput(
      page,
      { month: form.expiresAtMonth, day: form.expiresAtDay, year: form.expiresAtYear },
      changes.expiresOn,
    );
  }

  if (changes.reset) {
    await page.locator(form.reset).click();
    await expect(page.locator(form.reset)).toBeChecked();
  }

  await page.locator(form.save).click();
}

/**
 * Edits a key without resetting it, and returns once the panel has closed on
 * a successful save.
 *
 * The one-time key dialog must not open: a save that returns no key shows a
 * snackbar instead. Checked once the panel has gone, when a dialog raised by
 * the same save would already be on screen.
 */
export async function editApiKey(page: Page, name: string, changes: Omit<ApiKeyChanges, 'reset'>): Promise<void> {
  await submitApiKeyEdit(page, name, changes);

  await expect(page.locator(apiKeyLocators.form.name)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(apiKeyLocators.keyCreatedDialog.title)).toHaveCount(0);
}

/** Resets a key from its Edit form and returns the new key the dialog showed. */
export async function resetApiKey(page: Page, name: string): Promise<string> {
  await submitApiKeyEdit(page, name, { reset: true });

  return readKeyCreatedDialog(page);
}

/**
 * Closes the Edit panel without saving. The form is dirty by then, so the
 * unsaved-changes question is asserted rather than looked for.
 */
export async function discardApiKeyEdit(page: Page): Promise<void> {
  const { form } = apiKeyLocators;

  await page.locator(form.closePanel).click();
  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.name)).toBeHidden();
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
