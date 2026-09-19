/**
 * User management, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToUsers } from './navigation';
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
 * Waits for a row in the list before opening it, and that wait is load-bearing
 * rather than cosmetic: the username control gains its \"already in use\"
 * validator from a store subscription (`setNamesInUseValidator`), so a name
 * typed before the list has loaded can be accepted by a validator that has not
 * been added yet.
 */
export async function openAddUserForm(page: Page): Promise<void> {
  await goToUsers(page);
  await expect(page.locator(usersLocators.anyRow).first()).toBeVisible();

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
