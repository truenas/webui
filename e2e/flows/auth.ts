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

/**
 * The same sign-in page, over plain HTTP.
 *
 * The insecure-connection warning is decided once, at construction, by
 * `window.location.protocol !== 'https:'` — so the only honest way to see it is
 * to load the page over HTTP, which the appliance serves on port 80 without
 * redirecting.
 *
 * Derived from the run's own base URL rather than built from `TN_HOST`, so this
 * follows the target the rest of the suite was pointed at, including a
 * `TN_UI_BASE_URL` override.
 */
export function insecureSigninUrl(uiBaseUrl: string): string {
  const url = new URL('signin', uiBaseUrl);

  // Already cleartext — the `branch` profile's dev server, or a `TN_UI_BASE_URL`
  // pointing at one. Nothing to rewrite, and rewriting anyway is how this first
  // went wrong: blanking the port sent `http://localhost:4200/` to port 80.
  if (url.protocol === 'http:') {
    return url.toString();
  }

  url.protocol = 'http:';

  // Only an explicit `:443` is dropped, and only because it would otherwise
  // become a cleartext request to the TLS port. A port that means something
  // else is the caller's and is left alone.
  if (url.port === '443') {
    url.port = '';
  }

  return url.toString();
}

/**
 * Submits the sign-in form and returns, whatever happens next.
 *
 * The counterpart to {@link signIn} for tests *about* rejection. `signIn` waits
 * for the admin shell and throws on the middleware error dialog, so a test
 * asserting a refusal cannot use it: the outcome it is looking for is the one
 * that helper treats as a failure.
 *
 * Deliberately asserts nothing itself. What a rejected attempt should show —
 * the inline message, the form still standing, no session — belongs in the test
 * that is making the claim, not hidden in a flow.
 *
 * Waits for the username field to be *enabled* rather than merely present: the
 * page renders before the websocket connects and the whole form is disabled
 * until it does (`canLogin$` in `signin.store.ts`), so filling too early lands
 * in a disabled control.
 */
export async function attemptSignIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto('./signin');

  const usernameField = page.locator(signinLocators.username);
  await expect(usernameField).toBeEnabled({ timeout: signInTimeoutMs });

  await usernameField.fill(username);
  await page.locator(signinLocators.password).fill(password);
  await page.locator(signinLocators.submit).click();
}

/**
 * Asserts an attempt was refused: the message says so, and no session exists.
 *
 * Both halves matter. The message alone would pass if the app displayed an
 * error and signed the user in anyway, and the absence of a shell alone would
 * pass if the form silently did nothing.
 *
 * Reads the inline error rather than the toast. Both carry the same words, but
 * the toast dismisses itself after four seconds, so an assertion on it races a
 * timer for no benefit.
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
