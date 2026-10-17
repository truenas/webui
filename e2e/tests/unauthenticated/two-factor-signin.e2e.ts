/**
 * Stories: a user with two-factor gets in with the right code, and middleware
 * records the session as opened on one; a wrong code is refused back to the
 * password step with no session, and the password and the right code from there
 * sign the user in; and a user who cancels the code step goes back to the
 * password form with no session.
 *
 * `two-factor.e2e.ts` already signs in with a right code and is refused a wrong
 * one, but it loads the page afresh between the two. This adds what the form
 * shows after a refusal and the sign-in from there, the session middleware
 * opens, and the step's Cancel, which nothing else drives.
 *
 * Under `tests/unauthenticated/` because every claim here is about signing in,
 * which the token bypass would skip (R4.2). Each password and each code is one
 * `auth.login_ex`, and every one spends from the unauthenticated rate limit (20
 * per method per IP per 60s): seven across this file.
 *
 * The secret is armed over the API: setting it up through the UI is the claim of
 * `two-factor.e2e.ts` and `two-factor-setup.e2e.ts`, not this one. A fresh one per
 * test, so no code is ever replayed (`pam_oath` refuses a code it has seen). Codes
 * are computed on the appliance's clock (`applianceNow`), which is the one
 * middleware checks them against, and neither a secret nor a code is quoted in an
 * assertion: they are only ever typed into the field.
 *
 * Global two-factor is on here as a precondition, and left on it would put every
 * later account with no secret — the suite's admin included — through the setup
 * dialog. So it is turned off after each test, unconditionally and not skipped
 * under `TN_KEEP_TEST_DATA`, and the user goes with it: its armed secret would
 * otherwise ask for a code at its next sign-in in another spec.
 */
import {
  armTwoFactorSecret, disableGlobalTwoFactor, ensureTwoFactorUserPresent, readGlobalTwoFactor,
  setGlobalTwoFactor, twoFactorSessionUsernames, twoFactorUser,
  type GlobalTwoFactorConfig,
} from '../../fixtures/two-factor';
import { ensureUserAbsent } from '../../fixtures/users';
import {
  attemptSignIn, awaitAdminShell, expectSignInRefused, expectSignedInAs, signInTimeoutMs, submitSignIn,
} from '../../flows/auth';
import { submitOneTimePassword } from '../../flows/two-factor';
import { signinLocators } from '../../locators/signin';
import { runCleanupSteps } from '../../support/cleanup';
import { adminLayout } from '../../support/constants';
import { expect, test } from '../../support/fixtures';
import { applianceNow, totpCode, wrongTotpCode } from '../../support/totp';

/** What the sign-in page says for a code middleware refused (`SigninStore.getLoginErrorMessage`). */
const wrongCodeMessage = 'Incorrect or expired OTP. Enter your password again to get a new code prompt.';

/**
 * One step either side of now, so a code computed just before a 30-second
 * boundary is still accepted once it reaches the appliance.
 */
const toleranceWindow = 1;

/** Global two-factor as the run found it: the tolerance window and SSH are written back from this. */
let baseline: GlobalTwoFactorConfig | undefined;

/** The secret armed for this test's user. */
let secret = '';

function foundBaseline(): GlobalTwoFactorConfig {
  if (!baseline) {
    throw new Error('Global two-factor was never read, so there is nothing to restore it from.');
  }
  return baseline;
}

test.beforeAll(async ({ api }) => {
  baseline = await readGlobalTwoFactor(api);
});

/** Deleting the account first is also what removes a secret an interrupted run left on it. */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, twoFactorUser.username);
  await ensureTwoFactorUserPresent(api);
  await setGlobalTwoFactor(api, {
    enabled: true,
    window: toleranceWindow,
    services: foundBaseline().services,
  });
  secret = await armTwoFactorSecret(api, twoFactorUser.username);
});

test.afterEach(async ({ api }) => {
  await runCleanupSteps([
    ['delete the user, and its secret with it', () => ensureUserAbsent(api, twoFactorUser.username)],
    ['turn global two-factor off', () => disableGlobalTwoFactor(api, foundBaseline())],
  ]);
});

test('the password is followed by a code step, and the right code signs the user in', async ({
  page, api,
}) => {
  const { username, password } = twoFactorUser;

  await test.step('the password is accepted, and the form asks for a code instead', async () => {
    await attemptSignIn(page, username, password);

    await expect(page.locator(signinLocators.otp)).toBeVisible({ timeout: signInTimeoutMs });
    await expect(page.locator(signinLocators.username)).toBeHidden();
  });

  await test.step('the code the secret gives now signs them in', async () => {
    await submitOneTimePassword(page, totpCode(secret, await applianceNow(api)));

    await awaitAdminShell(page, username);
    await expectSignedInAs(page, username);
  });

  // The shell says the app let them in; this says middleware opened the session
  // on a code. Asserted to appear rather than to stay, in case the app later
  // moves it onto a token.
  await expect.poll(
    () => twoFactorSessionUsernames(api),
    { timeout: signInTimeoutMs, message: `no LOGIN_TWOFACTOR session for "${username}"` },
  ).toContain(username);
});

/*
 * Middleware ends the pending code step on any code it checks, so a second code
 * from the same step used to be answered `[EINVAL] OTP_TOKEN: no authentication
 * in progress` whatever it was (E2E run 39039886861). The form now goes back to
 * the password instead, and the right code after it is what this proves works.
 */
test('a wrong code is refused back to the password step, and the password then the right code sign in', async ({
  page, api,
}) => {
  const { username, password } = twoFactorUser;
  const otpField = page.locator(signinLocators.otp);

  await test.step('a wrong code is refused, and the form asks for the password again', async () => {
    await attemptSignIn(page, username, password);
    await expect(otpField).toBeVisible({ timeout: signInTimeoutMs });

    await submitOneTimePassword(page, wrongTotpCode(secret, await applianceNow(api)));

    await expectSignInRefused(page, wrongCodeMessage);
    await expect(otpField).toBeHidden();
    // Read once the refusal is on screen, so the answer to the code is already in.
    expect(await twoFactorSessionUsernames(api)).not.toContain(username);
  });

  await test.step('the password and then the right code sign them in', async () => {
    // From the form the refusal left, not a fresh page: that form is the claim.
    await submitSignIn(page, username, password);
    await submitOneTimePassword(page, totpCode(secret, await applianceNow(api)));

    await awaitAdminShell(page, username);
    await expectSignedInAs(page, username);
  });
});

test('cancelling the code step goes back to the password form, with no session', async ({ page }) => {
  const { username, password } = twoFactorUser;
  const usernameField = page.locator(signinLocators.username);

  await attemptSignIn(page, username, password);
  await expect(page.locator(signinLocators.otp)).toBeVisible({ timeout: signInTimeoutMs });
  // Hidden before Cancel, so its coming back below is the Cancel's doing.
  await expect(usernameField).toBeHidden();

  await page.locator(signinLocators.otpCancel).click();

  await expect(usernameField).toBeVisible();
  await expect(usernameField).toBeEnabled();
  await expect(page.locator(signinLocators.otp)).toBeHidden();
  // The user comes back to an empty password. The app emptied it when it asked
  // for a code, before Cancel, so this says nothing about Cancel itself.
  await expect(page.locator(signinLocators.password)).toHaveValue('');
  await expect(page.locator(adminLayout)).toBeHidden();
});
