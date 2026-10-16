/**
 * Two-factor authentication, driven through the UI: switching it on for the
 * appliance, setting it up for an account, answering the sign-in page's code
 * prompt, and clearing it from a user's details.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings, goToUsers } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { signinLocators } from '../locators/signin';
import { twoFactorLocators } from '../locators/two-factor';
import { usersLocators } from '../locators/users';
import { totpCode } from '../support/totp';

const saveTimeoutMs = 60_000;

/**
 * Turns global two-factor on from its card on System > Advanced Settings.
 *
 * Waits for the card to read `Disabled` before opening the form, because the
 * form is filled from what the card last loaded and a box ticked before then
 * could be overwritten by it. The panel closing is the app's signal that the
 * save landed. On success the app also takes the admin to `/two-factor-auth`,
 * and this waits until that page has rendered: the route signed out from is the
 * one the next sign-in returns to, and {@link setUpTwoFactorOnPage} depends on it.
 * Signing out while that navigation is still in flight would leave the previous
 * route recorded instead.
 *
 * `toleranceWindow` is the form's Window: how many 30-second steps either side
 * of now a code is still accepted for, by the setup page and the sign-in page
 * alike.
 */
export async function enableGlobalTwoFactor(page: Page, toleranceWindow: number): Promise<void> {
  const { globalCard, globalForm } = twoFactorLocators;

  await goToAdvancedSettings(page);
  await expect(page.locator(globalCard.state)).toHaveText('Disabled');

  await page.locator(globalCard.configure).click();
  await closeFirstTimeWarning(page);

  await page.locator(globalForm.enabled).setChecked(true);
  await page.locator(globalForm.window).fill(String(toleranceWindow));
  await page.locator(globalForm.save).click();
  await expect(page.locator(globalForm.save)).toBeHidden({ timeout: saveTimeoutMs });

  await expect(page).toHaveURL(/\/two-factor-auth\/?$/, { timeout: saveTimeoutMs });
  await expect(page.locator(twoFactorLocators.setup.configureSecret)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Sets two-factor up on the `/two-factor-auth` page, and returns the secret.
 *
 * The way a person does it: generate a secret, read it off the screen, type in
 * the code an authenticator app shows for it. The app checks that code itself
 * and offers Unset only once it matches, so Unset appearing is the app saying
 * the secret on screen is the one the account now holds.
 *
 * Expects the page to be on screen already. The sign-in returns to the route the
 * last session signed out from (`redirectUrl`), which {@link enableGlobalTwoFactor}
 * leaves here. On this route the admin layout's guard shows the page and does not
 * raise its full-screen setup dialog, so nothing here covers that dialog.
 */
export async function setUpTwoFactorOnPage(page: Page): Promise<string> {
  const { setup } = twoFactorLocators;

  await expect(page).toHaveURL(/\/two-factor-auth\/?$/, { timeout: saveTimeoutMs });
  await page.locator(setup.configureSecret).click();

  const secretText = page.locator(setup.secret);
  await expect(secretText).not.toBeEmpty({ timeout: saveTimeoutMs });
  const secret = (await secretText.innerText()).trim();

  await page.locator(setup.code).fill(totpCode(secret));
  await page.locator(setup.confirmCode).click();

  await expect(page.locator(setup.unsetSecret)).toBeVisible({ timeout: saveTimeoutMs });
  await expect(page.locator(setup.code)).toBeHidden();

  return secret;
}

/**
 * Answers the sign-in page's code prompt and submits it.
 *
 * The prompt appears only after the password was accepted and middleware asked
 * for a code, so waiting for it is also waiting for that. Asserts nothing about
 * the outcome.
 */
export async function submitOneTimePassword(page: Page, code: string): Promise<void> {
  const field = page.locator(signinLocators.otp);
  await expect(field).toBeVisible({ timeout: saveTimeoutMs });

  await field.fill(code);
  await page.locator(signinLocators.submit).click();
}

/**
 * Clears a user's two-factor from their details, beside the Users list.
 *
 * Selecting the row is what puts that user's Access card on screen. The button
 * goes once the card has reloaded a user with no secret, which is the app's own
 * signal that the change landed.
 */
export async function clearTwoFactorFromUserDetails(page: Page, username: string): Promise<void> {
  const clear = page.locator(twoFactorLocators.clearTwoFactor(username));

  await goToUsers(page);
  await page.locator(usersLocators.row(username)).click();

  await clear.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(clear).toBeHidden({ timeout: saveTimeoutMs });
}
