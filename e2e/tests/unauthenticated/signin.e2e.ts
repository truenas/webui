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
 * The first-time-setup form, the session-expired toast, the failover-validation
 * errors and the disconnected state are all real states of this page, and none
 * can be reached on a working appliance without mocking the API or rigging the
 * box. This suite drives the UI against a real system, so they are out of scope
 * rather than faked.
 *
 * The login banner is **not** in that group, though it was listed there once.
 * `system.advanced.login_banner` is an ordinary config string, so the banner is
 * an ordinary precondition. It is left for later on its cost rather than its
 * reachability: it is global state, and a banner leaked by a failed teardown
 * puts a full-screen dialog in front of every other test's sign-in.
 *
 * Two-factor is out of scope for now. Enabling it is a global setting
 * (`auth.twofactor.update`), so a teardown that failed to turn it off would
 * make every other test's sign-in — including the token bypass — demand an OTP.
 */
import {
  ensureNoPrivilegeAccountPresent, ensureNoWebUiAccessAccountPresent, ensureRefusedAccountsAbsent,
  refusedAccounts,
} from '../../fixtures/users';
import {
  attemptSignIn, awaitAdminShell, expectSignInRefused, insecureSigninUrl, signIn, signOut, submitSignIn,
} from '../../flows/auth';
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

/**
 * The authorization refusals need accounts made for them, and removed again
 * whatever happens (R3.2). Cleanup runs before each test as well, so a run
 * interrupted midway leaves the next one able to start (R3.5).
 *
 * The `api` fixture is worker-scoped, so both hooks share one connection rather
 * than paying a sign-in each — and sign-ins are the scarce resource here, not
 * queries.
 */
test.describe('accounts that may not use the UI', () => {
  test.beforeEach(async ({ api }) => {
    await ensureRefusedAccountsAbsent(api);
  });

  test.afterEach(async ({ api }) => {
    await ensureRefusedAccountsAbsent(api);
  });

  /**
   * The simpler of the two: middleware itself says no.
   *
   * An account with a valid password and no privilege gets `DENIED` from
   * `auth.login_ex`, which the app maps to `LoginResult.Denied`. The message
   * points at the actual remedy — grant the account a role — rather than
   * implying the password was wrong, and that distinction is the whole value of
   * the assertion. A regression to the generic wrong-username-or-password text
   * would send an administrator to reset a password that was never the problem.
   */
  test('an account with no roles is told it needs roles, not that it mistyped', async ({ page, api }) => {
    await ensureNoPrivilegeAccountPresent(api);

    await attemptSignIn(page, refusedAccounts.noPrivilege.username, refusedAccounts.noPrivilege.password);
    await expectSignInRefused(page, 'Login denied. Please ensure proper roles have been granted to the user.');
  });

  /**
   * The one worth having: middleware says yes and the app must still say no.
   *
   * This account holds a privilege, so `auth.login_ex` answers `SUCCESS` with a
   * real session — the credentials are right and the account is entitled to
   * *something*. What it is not entitled to is this UI, and the only thing that
   * notices is `auth.service.ts` reading `user_info.privilege.webui_access` and
   * mapping a false to `LoginResult.NoAccess`.
   *
   * Nothing on the middleware side would catch that check being dropped: from
   * there the login succeeded. That is what makes this worth an end-to-end test
   * rather than a unit test of the mapping — the claim is about the whole path,
   * from an account configured on a real appliance to what the browser shows.
   */
  test('an account middleware authenticates is still refused the UI it cannot use', async ({ page, api }) => {
    await ensureNoWebUiAccessAccountPresent(api);

    await attemptSignIn(page, refusedAccounts.noWebUiAccess.username, refusedAccounts.noWebUiAccess.password);
    await expectSignInRefused(page, 'User is lacking permissions to access WebUI.');
  });
});

/**
 * Where you were going is where you end up.
 *
 * `AuthGuardService` stores the route it turned away (`state.url`) and
 * `SigninStore.getRedirectUrl` reads it back after a successful login, so a
 * bookmark or a stale tab survives the detour through sign-in. The existing
 * deep-link test above covers only the outward half — that an unauthenticated
 * visitor is bounced. This is the return trip, which is the half a user
 * actually feels.
 *
 * Deliberately does *not* go through `signIn`, which navigates to `./signin`
 * first. The visitor is already there, put there by the guard; navigating again
 * would be a step nobody takes, in the one test where arriving by redirect is
 * the premise.
 */
test('a deep link survives the detour through sign-in', async ({ page, config }) => {
  // A guarded route, reached the way a bookmark reaches it. One of the two
  // places this suite may navigate by URL, and for the same reason as the test
  // above: typing a deep link is the thing under test.
  await page.goto('./credentials/users');

  await expect(page.locator(signinLocators.username)).toBeEnabled();
  await expect(page).toHaveURL(/\/signin/);

  await submitSignIn(page, config.username, config.password);
  await awaitAdminShell(page, config.username);

  // The point: not `/dashboard`, which is where every login that has nowhere
  // else to go lands — so a broken redirect would still look like a clean sign-in.
  await expect(page).toHaveURL(/\/credentials\/users/);
});

/**
 * Signing out has to end the session, not merely leave the page.
 *
 * `admin-user.e2e.ts` signs out as a step of its journey, but nothing there
 * asserts the session is *gone* — only that the form came back. A sign-out that
 * navigated without clearing the token would satisfy that and still leave the
 * appliance one Back button away from an authenticated shell.
 *
 * Going back is the honest way to ask. It replays the route the user was on
 * from history, which is exactly what an abandoned browser on a shared desk
 * does, and it puts the question to the auth guard rather than to the sign-out
 * button's own bookkeeping.
 *
 */
test('signing out ends the session, and going back does not resurrect it', async ({ page, config }) => {
  await signIn(page, config.username, config.password);
  await signOut(page);

  await page.goBack();

  await expect(page.locator(signinLocators.username)).toBeEnabled();
  await expect(page.locator(adminLayout)).toBeHidden();
  await expect(page).toHaveURL(/\/signin/);
});
