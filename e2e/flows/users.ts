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
  await goToUsers(page);

  await page.locator(usersLocators.addUser).click();

  const form = usersLocators.form;
  await expect(page.locator(form.username)).toBeVisible();
  await page.locator(form.username).fill(user.username);

  // Grants UI access. The role control does not exist until this is checked,
  // so the order here matters.
  await page.locator(form.truenasAccess).click();

  await page.locator(form.role).click();
  await page.locator(form.roleFullAdmin).click();

  await page.locator(form.password).fill(user.password);
  await page.locator(form.passwordConfirm).fill(user.password);

  await page.locator(form.save).click();

  // The panel closing is the app's own signal that the save succeeded — a
  // validation failure leaves it open with the error attached.
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
