/**
 * Sign-in and sign-out, driven through the UI.
 *
 * These deliberately use the real form rather than the token bypass in
 * `support/auth` — a test of authentication that authenticates by side channel
 * tests nothing (R4.2).
 */
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { signinLocators } from '../locators/signin';
import { topbarLocators } from '../locators/topbar';
import { adminLayout, errorDialogClose, errorDialogRole } from '../support/constants';

/** Generous: a cold sign-in on this app runs to roughly 15 seconds. */
const signInTimeoutMs = 60_000;

/** Short: this only asks whether an origin answers at all. */
const httpProbeTimeoutMs = 10_000;

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
  await submitSignIn(page, username, password);
  await awaitAdminShell(page, username);
}

/**
 * Fills the sign-in form already on screen, and submits it.
 *
 * Split from {@link signIn} for the one journey that must not navigate: a
 * visitor the auth guard bounced here is already on the page, and the deep link
 * it stored is the thing under test. Waits for the field to be *enabled* — the
 * form is disabled until the websocket connects (`canLogin$` in signin.store).
 */
export async function submitSignIn(page: Page, username: string, password: string): Promise<void> {
  const usernameField = page.locator(signinLocators.username);
  await expect(usernameField).toBeEnabled({ timeout: signInTimeoutMs });

  await usernameField.fill(username);
  await page.locator(signinLocators.password).fill(password);
  await page.locator(signinLocators.submit).click();
}

/**
 * Waits for the admin shell, failing usefully when middleware objects instead.
 *
 * The shell rather than a URL change: the redirect lands before the app is
 * usable. Raced against the error dialog, so a failed login reports the real
 * cause instead of spending the timeout and blaming a missing layout.
 */
export async function awaitAdminShell(page: Page, username: string): Promise<void> {
  const shell = page.locator(adminLayout);
  const errorDialog = page.locator(errorDialogClose);

  await expect(shell.or(errorDialog).first()).toBeVisible({ timeout: signInTimeoutMs });

  // The development build's concurrency dialog does not reach here: the handler
  // in `support/fixtures.ts` dismisses it during the wait above, and stops at
  // its cap so an unrelenting one still surfaces as the failure below.
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

/**
 * The sign-in page on the target's cleartext origin.
 *
 * The warning is decided from `window.location.protocol`, so the only honest
 * way to see it is to load over HTTP. Which address that is belongs to
 * `support/config.ts`, the one place this suite resolves URLs — it is not
 * always the same host and port as the HTTPS one.
 */
export function insecureSigninUrl(insecureUiBaseUrl: string): string {
  return new URL('signin', insecureUiBaseUrl).toString();
}

/**
 * Whether the UI is really served over plain HTTP at this address.
 *
 * Two ways a target has no cleartext origin, and neither refuses the request:
 * CI's HTTPS-only container answers "400 plain HTTP request sent to HTTPS
 * port", and an appliance with `ui_httpsredirect` on answers a 301 to HTTPS.
 * `request.get` follows redirects, so a status alone would call the second one
 * a success — the scheme actually landed on is what settles it.
 */
export async function servesUiOverHttp(request: APIRequestContext, url: string): Promise<boolean> {
  try {
    const response = await request.get(url, { timeout: httpProbeTimeoutMs, failOnStatusCode: false });
    return response.ok() && new URL(response.url()).protocol === 'http:';
  } catch {
    // Nothing listening, or TLS refused the cleartext request outright.
    return false;
  }
}

/**
 * Submits the sign-in form and returns, whatever happens next.
 *
 * The counterpart to {@link signIn} for tests *about* rejection, which cannot
 * use it: the outcome they look for is the one it treats as a failure.
 *
 * Asserts nothing itself — what a refusal should show belongs in the test
 * making the claim, not hidden in a flow.
 */
export async function attemptSignIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto('./signin');
  await submitSignIn(page, username, password);
}

/**
 * Asserts an attempt was refused: the message says so, and no session exists.
 *
 * Both halves matter — the message alone would pass if the app errored and
 * signed the user in anyway; a missing shell alone would pass if the form did
 * nothing. Reads the inline error, not the toast, which self-dismisses after
 * four seconds and would race a timer for no benefit.
 */
export async function expectSignInRefused(page: Page, message: string | RegExp): Promise<void> {
  await expect(page.locator(signinLocators.error)).toContainText(message, { timeout: signInTimeoutMs });
  await expect(page.locator(adminLayout)).toBeHidden();
  await expect(page.locator(signinLocators.username)).toBeVisible();
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
