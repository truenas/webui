/**
 * User management, driven through the UI.
 */
import { expect, type Download, type Page } from '@playwright/test';
import { goToUsers } from './navigation';
import { apiKeyLocators } from '../locators/api-keys';
import { confirmDialogLocators } from '../locators/dialogs';
import { usersLocators } from '../locators/users';

export interface NewAdminUser {
  username: string;
  password: string;
}

/** User creation is a job on the appliance and is not instant. */
const saveTimeoutMs = 60_000;

/**
 * Creates a user with TrueNAS UI access and the Full Admin role, through the
 * add-user side panel.
 *
 * Navigates there through the sidebar, as a user would.
 */
export async function createTrueNasAdminUser(page: Page, user: NewAdminUser): Promise<void> {
  await openAddUserForm(page);

  const form = usersLocators.form;
  await page.locator(form.username).fill(user.username);

  // Grants UI access. The role control does not exist until this is checked,
  // so the order here matters.
  await page.locator(form.truenasAccess).click();

  await page.locator(form.role).click();
  await page.locator(form.roleFullAdmin).click();

  await fillPassword(page, user.password);
  await saveUserForm(page);
}

/**
 * Opens the add-user side panel, from the sidebar as a user would.
 *
 * Deliberately waits on nothing but the form. The names-in-use validator is fed
 * by a `user.query` the *store* runs (`userPageEntered`), separate from the one
 * the list renders from, so a visible row would not order it — and the form
 * revalidates when that response lands, so nothing needs to.
 */
export async function openAddUserForm(page: Page): Promise<void> {
  await goToUsers(page);

  await page.locator(usersLocators.addUser).click();
  await expect(page.locator(usersLocators.form.username)).toBeVisible();
}

/** Fills a password and its confirmation with the same value. */
export async function fillPassword(page: Page, password: string): Promise<void> {
  await page.locator(usersLocators.form.password).fill(password);
  await page.locator(usersLocators.form.passwordConfirm).fill(password);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * validation failure leaves it open with the error attached.
 */
export async function saveUserForm(page: Page): Promise<void> {
  await page.locator(usersLocators.form.save).click();
  await expect(page.locator(usersLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Selects a user in the list and opens the delete confirmation for it.
 *
 * Selecting first is what makes this a row-targeting test: the pane's Delete
 * belongs to whichever user the list has selected, so clicking the wrong row
 * deletes the wrong account with no other symptom.
 */
export async function openDeleteUserDialog(page: Page, username: string): Promise<void> {
  await goToUsers(page);

  await page.locator(usersLocators.row(username)).click();
  await page.locator(usersLocators.deleteUser(username)).click();
  await expect(page.locator(usersLocators.deleteDialog.title)).toBeVisible();
}

/** Confirms the open delete dialog and waits for it to go. */
export async function confirmUserDeletion(page: Page): Promise<void> {
  await page.locator(usersLocators.deleteDialog.confirm).click();
  await expect(page.locator(usersLocators.deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens a user's details from the Users list, from the sidebar as a user would.
 *
 * The details are not a page of their own: selecting the row is what puts that
 * user's Access and Password cards beside the list. Waits on the Access card's
 * SSH line, which every user's card renders, so what follows acts on that user's
 * cards and not on whoever was selected before.
 */
export async function openUserDetails(page: Page, username: string): Promise<void> {
  await goToUsers(page);

  await page.locator(usersLocators.row(username)).click();
  await expect(page.locator(usersLocators.sshAccess(username))).toBeVisible();
}

/**
 * Locks or unlocks the user whose details are open, through the Access card.
 *
 * Both raise the shared confirmation without its tick box. The card swaps the
 * button for its opposite once it has reloaded the user, which is the app's own
 * signal that the change landed — so that is what this waits on.
 */
export async function lockUser(page: Page, username: string): Promise<void> {
  await toggleLock(page, usersLocators.lockUser(username), usersLocators.unlockUser(username));
}

export async function unlockUser(page: Page, username: string): Promise<void> {
  await toggleLock(page, usersLocators.unlockUser(username), usersLocators.lockUser(username));
}

async function toggleLock(page: Page, button: string, opposite: string): Promise<void> {
  await page.locator(button).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(opposite)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Generates a one-time password for the user whose details are open, and returns it.
 *
 * The dialog is the only place the password is ever shown, so it is read before
 * the dialog is closed.
 */
export async function generateOneTimePassword(page: Page, username: string): Promise<string> {
  const dialog = usersLocators.oneTimePasswordDialog;

  await page.locator(usersLocators.generateOneTimePassword(username)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(dialog.title)).toBeVisible({ timeout: saveTimeoutMs });
  const password = await page.locator(dialog.password).inputValue();

  await page.locator(dialog.close).click();
  await expect(page.locator(dialog.title)).toBeHidden();

  return password;
}

/**
 * Adds a non-expiring key from the Access card of the user whose details are open.
 *
 * The card opens the same form the API Keys page does, with the account already
 * picked, so only the name is filled here: whether the key lands on that account
 * is the claim, and filling the account in would hide a form that ignored it.
 * The key the dialog shows is closed unread — `api-keys.e2e.ts` covers that.
 */
export async function addApiKeyFromAccessCard(
  page: Page,
  { name, username }: { name: string; username: string },
): Promise<void> {
  const { form, keyCreatedDialog } = apiKeyLocators;

  await page.locator(usersLocators.addApiKey(username)).click();
  await expect(page.locator(form.name)).toBeVisible();
  await page.locator(form.name).fill(name);
  await page.locator(form.save).click();

  await expect(page.locator(keyCreatedDialog.title)).toBeVisible({ timeout: saveTimeoutMs });
  await page.locator(keyCreatedDialog.close).click();
  await expect(page.locator(keyCreatedDialog.title)).toBeHidden();
}

/**
 * Downloads the public key of the user whose details are open, and returns the download.
 *
 * The app builds the file in the browser from the user it already holds, so the
 * download starts on the click with no call in between.
 */
export async function downloadUserPublicKey(page: Page, username: string): Promise<Download> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator(usersLocators.downloadPublicKey(username)).click(),
  ]);

  return download;
}
