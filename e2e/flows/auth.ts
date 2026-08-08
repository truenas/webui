/**
 * Sign-in and sign-out, driven through the UI.
 *
 * These deliberately use the real form rather than the token bypass in
 * `support/auth` — a test of authentication that authenticates by side channel
 * tests nothing (R4.2).
 */
import { expect, type Page } from '@playwright/test';
import { signinLocators } from '../locators/signin';
import { topbarLocators } from '../locators/topbar';
import { adminLayout, errorDialogClose, errorDialogRole } from '../support/constants';

/** Generous: a cold sign-in on this app runs to roughly 15 seconds. */
const signInTimeoutMs = 60_000;

/**
 * Signs in through the form and waits for the admin shell.
 *
 * Waits on the shell rather than a URL change: the redirect happens before the
 * app is usable, so asserting on it would let the next action race the render.
 *
 * Races the shell against the middleware error dialog. Without that, a failed
 * login spends the full timeout and then reports `ix-admin-layout` missing —
 * true, but useless, while a dialog naming the real cause sits on screen. The
 * rate limit (see below) is the common case and reads as a total non-sequitur.
 */
export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto('./signin');

  await page.locator(signinLocators.username).fill(username);
  await page.locator(signinLocators.password).fill(password);
  await page.locator(signinLocators.submit).click();

  const shell = page.locator(adminLayout);
  const errorDialog = page.locator(errorDialogClose);

  await expect(shell.or(errorDialog).first()).toBeVisible({ timeout: signInTimeoutMs });

  if (await errorDialog.isVisible()) {
    const details = (await page.getByRole(errorDialogRole).innerText()).trim();
    throw new Error(
      `Sign-in as "${username}" failed with a middleware error:\n\n${details}\n\n`
      + 'If this is "[EBUSY] Rate Limit Exceeded": middleware allows 20 unauthenticated '
      + 'calls per method per IP per 60s (RateLimitConfig). Authenticated calls are exempt, '
      + 'so the budget is spent on sign-ins. Wait a minute, or reduce logins per run.',
    );
  }

  await expect(shell).toBeVisible();
}

/** Signs out via the topbar user menu and waits for the sign-in form. */
export async function signOut(page: Page): Promise<void> {
  await page.locator(topbarLocators.userMenu).click();
  await page.locator(topbarLocators.logOut).click();

  await expect(page.locator(signinLocators.username)).toBeVisible({ timeout: signInTimeoutMs });
}

/**
 * Asserts which user the session belongs to.
 *
 * The topbar trigger projects the signed-in username as its text, which is the
 * only place the UI states it plainly.
 */
export async function expectSignedInAs(page: Page, username: string): Promise<void> {
  await expect(page.locator(topbarLocators.userMenu)).toContainText(username);
}
