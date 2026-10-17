/**
 * Two-factor authentication, driven through the UI: switching it on for the
 * appliance and changing its settings, skipping the setup dialog, setting it up,
 * renewing and unsetting it for an account on the setup card, answering the
 * sign-in page's code prompt, and clearing it from a user's details.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { openUserDetails } from './users';
import { setGlobalTwoFactor } from '../fixtures/two-factor';
import { confirmDialogLocators } from '../locators/dialogs';
import { signinLocators } from '../locators/signin';
import { topbarLocators } from '../locators/topbar';
import { twoFactorLocators } from '../locators/two-factor';
import type { E2eApiClient } from '../support/api/client';
import { totpCode } from '../support/totp';

const saveTimeoutMs = 60_000;

/**
 * Opens the Global Two Factor Authentication form from its card on System >
 * Advanced Settings, once the card reads `expectedState`.
 *
 * Waits for the card first because the form is filled from what the card last
 * loaded, and a box ticked before then could be overwritten by it. Closes the
 * first-time warning, so call it only for the first form the page opens.
 */
export async function openGlobalTwoFactorForm(page: Page, expectedState: 'Enabled' | 'Disabled'): Promise<void> {
  const { globalCard } = twoFactorLocators;

  await goToAdvancedSettings(page);
  await expect(page.locator(globalCard.state)).toHaveText(expectedState);

  await page.locator(globalCard.configure).click();
  await closeFirstTimeWarning(page);
}

/**
 * Turns global two-factor on from its card on System > Advanced Settings.
 *
 * The panel closing is the app's signal that the save landed. On success the
 * app also takes the admin to `/two-factor-auth`,
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
  const { globalForm } = twoFactorLocators;

  await openGlobalTwoFactorForm(page, 'Disabled');

  await page.locator(globalForm.enabled).setChecked(true);
  await page.locator(globalForm.window).fill(String(toleranceWindow));
  await page.locator(globalForm.save).click();
  await expect(page.locator(globalForm.save)).toBeHidden({ timeout: saveTimeoutMs });

  await expect(page).toHaveURL(/\/two-factor-auth\/?$/, { timeout: saveTimeoutMs });
  await expect(page.locator(twoFactorLocators.setup.configureSecret)).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * Accepts the "Warning!" the form raises when a save keeps global two-factor on,
 * which says user secrets may be reset. Raised without `hideCheckbox`, so its
 * confirm button stays disabled until the box is ticked.
 */
export async function confirmGlobalTwoFactorChange(page: Page): Promise<void> {
  const confirm = page.locator(confirmDialogLocators.confirm);

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
}

/**
 * Skips the full-screen setup dialog, and confirms the skip.
 *
 * The admin layout's guard raises it on the first route of a session while
 * two-factor is on globally and the account has no secret, and holds that route
 * until it closes. Waited for rather than probed: a probe made before it renders
 * finds nothing and leaves it over the next click. Skipping writes nothing, so
 * the account still has no secret afterwards.
 */
export async function skipTwoFactorSetupPrompt(page: Page): Promise<void> {
  const { setupDialog } = twoFactorLocators;

  await expect(page.locator(setupDialog.title)).toBeVisible({ timeout: saveTimeoutMs });
  await page.locator(setupDialog.skip).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(setupDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Turns global two-factor on over the API under a page that is already signed
 * in, reloads so the app reads it afresh, and skips the setup dialog that
 * raises. SSH starts off.
 *
 * For a spec that starts with it on. The token sign-in waits for the shell, so
 * turning it on before sign-in would spend that wait behind the dialog. Skipping
 * gives the suite's admin no secret.
 */
export async function startWithGlobalTwoFactorOn(
  page: Page,
  api: E2eApiClient,
  toleranceWindow: number,
): Promise<void> {
  await setGlobalTwoFactor(api, {
    enabled: true,
    window: toleranceWindow,
    services: { ssh: false },
  });
  await page.reload();
  await skipTwoFactorSetupPrompt(page);
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
  const secret = await generateTwoFactorSecret(page);
  await confirmTwoFactorCode(page, totpCode(secret));

  await expect(page.locator(setup.unsetSecret)).toBeVisible({ timeout: saveTimeoutMs });
  await expect(page.locator(setup.code)).toBeHidden();

  return secret;
}

/**
 * Presses Configure 2FA Secret on the `ix-two-factor` card, and returns the
 * secret it then shows beside the QR code.
 *
 * The card is the same on the `/two-factor-auth` page and in the first-login
 * dialog, so this serves both. For an account with no secret: Configure asks
 * nothing first, where Renew on an account that has one asks for a confirmation
 * this does not answer.
 */
export async function generateTwoFactorSecret(page: Page): Promise<string> {
  const { setup } = twoFactorLocators;

  await page.locator(setup.configureSecret).click();

  const secretText = page.locator(setup.secret);
  await expect(secretText).not.toBeEmpty({ timeout: saveTimeoutMs });
  return (await secretText.innerText()).trim();
}

/**
 * Opens the `/two-factor-auth` page from the topbar user menu, which offers it
 * only while two-factor is on globally, and waits for the page to have read the
 * account: its secret buttons stay disabled until then.
 */
export async function openTwoFactorPage(page: Page): Promise<void> {
  await page.locator(topbarLocators.userMenu).click();
  await page.locator(topbarLocators.twoFactorAuth).click();

  await expect(page).toHaveURL(/\/two-factor-auth\/?$/, { timeout: saveTimeoutMs });
  await expect(page.locator(twoFactorLocators.setup.configureSecret)).toBeEnabled({ timeout: saveTimeoutMs });
}

/**
 * Presses Renew 2FA Secret on the `ix-two-factor` card, confirms it, and waits
 * for the new secret to be awaiting a code.
 *
 * For an account that already holds a secret, where Renew asks first — see
 * {@link generateTwoFactorSecret} for one that has none. Confirm Code is disabled
 * while the renewal and the account re-read behind it are in flight, so its
 * coming back enabled is the page saying the secret on screen is the new one.
 */
export async function renewTwoFactorSecret(page: Page): Promise<void> {
  const { setup } = twoFactorLocators;

  await page.locator(setup.configureSecret).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(setup.code)).toBeVisible({ timeout: saveTimeoutMs });
  await expect(page.locator(setup.confirmCode)).toBeEnabled({ timeout: saveTimeoutMs });
}

/**
 * Presses `button` on the `ix-two-factor` card — Unset 2FA Secret or Cancel
 * Setup, which both raise a confirmation and then unset the account's secret —
 * and confirms it. Asserts nothing about the outcome.
 */
export async function confirmUnsetFrom(page: Page, button: string): Promise<void> {
  await page.locator(button).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
}

/**
 * Types `code` into the card's confirmation field and presses Confirm Code.
 * Asserts nothing about the outcome: the app checks the code itself, and what
 * a right or wrong one should show belongs in the test making the claim.
 */
export async function confirmTwoFactorCode(page: Page, code: string): Promise<void> {
  const { setup } = twoFactorLocators;

  await page.locator(setup.code).fill(code);
  await page.locator(setup.confirmCode).click();
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
 * Selecting the row is what puts that user's Access card on screen.
 */
export async function clearTwoFactorFromUserDetails(page: Page, username: string): Promise<void> {
  await openUserDetails(page, username);
  await clearTwoFactorOnAccessCard(page, username);
}

/**
 * Clears two-factor from the Access card of the user whose details are open.
 *
 * The button goes once the card has reloaded a user with no secret, which is
 * the app's own signal that the change landed.
 */
export async function clearTwoFactorOnAccessCard(page: Page, username: string): Promise<void> {
  const clear = page.locator(twoFactorLocators.clearTwoFactor(username));

  await clear.click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(clear).toBeHidden({ timeout: saveTimeoutMs });
}
