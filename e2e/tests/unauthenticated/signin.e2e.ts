/**
 * Story: what the sign-in page does when sign-in does *not* simply work.
 *
 * `admin-user` and `fresh-install` cover the happy path — an account is made
 * and used. This spec covers the rest of the front door: the refusal, the
 * warning about how the page was served, what the password field shows, and
 * what an unauthenticated visitor gets when they aim past it.
 *
 * Lives under `tests/unauthenticated/` for the usual reason: these tests are
 * about authentication, and the token bypass would defeat them (R4.2).
 *
 * ## Why this spec is short
 *
 * Every submitted form is an unauthenticated middleware call, and middleware
 * allows 20 per method per IP per 60 seconds (`RateLimitConfig`). A spec that
 * enumerated wrong-password variants would spend that budget on restating one
 * assertion, and the next spec to sign in would fail with `[EBUSY] Rate Limit
 * Exceeded` — a failure that names nothing about the test that caused it. So
 * the refusals share a test, and everything provable without submitting is.
 *
 * ## What is deliberately not here
 *
 * The first-time-setup form, the login banner, the session-expired toast, the
 * failover-validation errors and the disconnected state are all real states of
 * this page, and none can be reached on a working appliance without mocking the
 * API or rigging the box. This suite drives the UI against a real system, so
 * they are out of scope rather than faked.
 *
 * Two-factor is out of scope for now. Enabling it is a global setting
 * (`auth.twofactor.update`), so a teardown that failed to turn it off would
 * make every other test's sign-in — including the token bypass — demand an OTP.
 */
import { attemptSignIn, expectSignInRefused, insecureSigninUrl } from '../../flows/auth';
import { signinLocators } from '../../locators/signin';
import { adminLayout } from '../../support/constants';
import { expect, test } from '../../support/fixtures';

/**
 * What the app says for a wrong username, a wrong password and a disabled
 * account alike.
 *
 * Middleware answers `AUTH_ERR` to all three, which the app maps to one message
 * (`SigninStore.getLoginErrorMessage`). That is the intended behaviour, not a
 * shortcoming: distinguishing them would tell an attacker which usernames are
 * real.
 */
const refusalMessage = 'Wrong username or password. Please try again.';

/** A username that cannot exist: `user.create` rejects these characters. */
const unknownUsername = 'nobody-at-all$$';

test('the form refuses bad credentials without saying which half was wrong', async ({ page, config }) => {
  await test.step('a real account with the wrong password is refused', async () => {
    await attemptSignIn(page, config.username, 'not-the-password');
    await expectSignInRefused(page, refusalMessage);
  });

  await test.step('an account that does not exist is refused identically', async () => {
    await attemptSignIn(page, unknownUsername, 'not-the-password');
    await expectSignInRefused(page, refusalMessage);
  });

  // No "and the right password still works" step here, deliberately. It would
  // guard against a form that refuses *everything* — but `admin-user.e2e.ts`
  // signs in through this same form in this same project, so that failure could
  // not hide. Proving it again costs another login out of the rate-limit budget,
  // and under the `branch` profile a third login in quick succession is what
  // raises the dev-only "Max Concurrent Calls" dialog, failing this test for a
  // reason that has nothing to do with what it asserts.
});

/**
 * The two halves of the insecure-connection warning are separate tests, not
 * steps of one, because the second is conditional and `test.skip()` skips the
 * whole test from wherever it is called — inside a step it took the HTTP case
 * with it, reporting a passing assertion as never run.
 */
test('signing in over HTTP warns that the connection is insecure', async ({ page, config }) => {
  // One of the two places this suite may navigate by URL: entering the app. The
  // point of the test is the scheme the page was loaded with, which no amount
  // of clicking can change.
  await page.goto(insecureSigninUrl(config.uiBaseUrl));

  const banner = page.locator(signinLocators.insecureConnectionBanner);
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Switch to HTTPS for secure access.');
});

test('signing in over HTTPS shows no such warning', async ({ page, config }) => {
  // Skipped rather than failed under the `branch` profile, whose dev server is
  // itself plain HTTP: the warning is correct there, and asserting its absence
  // would be asserting a bug. The test above still covers the warning itself.
  test.skip(
    !config.uiBaseUrl.startsWith('https:'),
    `the UI is served from ${config.uiBaseUrl}, so the insecure warning is expected everywhere`,
  );

  await page.goto('./signin');

  await expect(page.locator(signinLocators.username)).toBeEnabled();
  await expect(page.locator(signinLocators.insecureConnectionBanner)).toBeHidden();
});

test('the password is hidden until the user asks to see it', async ({ page }) => {
  await page.goto('./signin');

  const password = page.locator(signinLocators.password);
  await expect(password).toBeEnabled();
  await password.fill('hunter2');

  // The input's type is what actually hides the characters, and it is what a
  // shoulder-surfer or a screenshot would defeat if it regressed.
  await expect(password).toHaveAttribute('type', 'password');

  await page.locator(signinLocators.passwordToggle).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('hunter2');

  await page.locator(signinLocators.passwordToggle).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('an unauthenticated visitor aiming at the shell lands on sign-in', async ({ page }) => {
  // The other deliberate `page.goto`: typing a deep link is precisely the thing
  // under test, and it is how a bookmark or a stale tab arrives. `flows/
  // navigation.ts` exists for journeys *inside* the app, which this is not.
  await page.goto('./dashboard');

  await expect(page.locator(signinLocators.username)).toBeEnabled();
  await expect(page.locator(adminLayout)).toBeHidden();
  await expect(page).toHaveURL(/\/signin/);
});
