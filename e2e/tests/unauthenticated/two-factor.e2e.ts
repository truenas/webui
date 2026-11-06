/**
 * Story: an admin turns on global two-factor; the next account sets it up on the page it lands on, is then let in
 * only by a right code, and an admin can clear it from the user's details. One test with steps (R4.2), as each step
 * needs the last one's state and every sign-in spends from the rate limit. The sign-in page spends too, so after a
 * sign-out the next sign-in reuses the form on screen; reloading put the last sign-in over the limit when run close
 * behind `signin.e2e.ts`. Codes come from `support/totp.ts`. Global two-factor is turned off before the test and in
 * `afterAll`, whatever happened; the suite's admin never gets a secret, as the API client can't answer a code prompt.
 */
import {
  disableGlobalTwoFactor, ensureTwoFactorUserPresent, readGlobalTwoFactor, twoFactorUser,
  type GlobalTwoFactorConfig,
} from '../../fixtures/two-factor';
import { ensureUserAbsent, findUser } from '../../fixtures/users';
import {
  attemptSignIn, awaitAdminShell, expectSignedInAs, signIn, signOut, submitSignIn,
} from '../../flows/auth';
import {
  clearTwoFactorFromUserDetails, enableGlobalTwoFactor, setUpTwoFactorOnPage, submitOneTimePassword,
} from '../../flows/two-factor';
import { signinLocators } from '../../locators/signin';
import { leavingTestData } from '../../support/cleanup';
import { adminLayout } from '../../support/constants';
import { expect, test } from '../../support/fixtures';
import { totpCode, wrongTotpCode } from '../../support/totp';

/** What the sign-in page says for a code middleware refused (`SigninStore.getLoginErrorMessage`). */
const wrongCodeMessage = 'Incorrect or expired OTP. Enter your password again to get a new code prompt.';

/**
 * One step either side of now. The test computes each code moments before it is
 * checked, so this is only slack for a code that crosses a 30-second boundary on
 * its way to the appliance.
 */
const toleranceWindow = 1;

/** Global two-factor as the run found it: the tolerance window and SSH are written back from this. */
let baseline: GlobalTwoFactorConfig | undefined;

function foundBaseline(): GlobalTwoFactorConfig {
  if (!baseline) {
    throw new Error('Global two-factor was never read, so there is nothing to restore it from.');
  }
  return baseline;
}

test.beforeAll(async ({ api }) => {
  baseline = await readGlobalTwoFactor(api);
  // Off before anything signs in, in case an interrupted run left it on (R3.5).
  await disableGlobalTwoFactor(api, baseline);
});

/**
 * Unconditional, and deliberately not skipped under `TN_KEEP_TEST_DATA`: unlike
 * an object left behind to inspect, global two-factor left on breaks every sign-in
 * after it.
 */
test.afterAll(async ({ api }) => {
  if (baseline) {
    await disableGlobalTwoFactor(api, baseline);
  }
});

/** Deleting the account is also what removes its secret. */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, twoFactorUser.username);
  await ensureTwoFactorUserPresent(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`user "${twoFactorUser.username}"`)) {
    return;
  }
  await ensureUserAbsent(api, twoFactorUser.username);
});

test('two-factor is set up on its page, then asked for, and an admin can clear it', async ({ page, api, config }) => {
  const { username, password } = twoFactorUser;
  let secret = '';

  await test.step('an admin turns two-factor on from its card', async () => {
    await signIn(page, config.username, config.password);
    await enableGlobalTwoFactor(page, toleranceWindow);

    expect(await readGlobalTwoFactor(api)).toMatchObject({ enabled: true, window: toleranceWindow });
    await signOut(page);
  });

  await test.step('the user sets it up on the page they land on', async () => {
    await submitSignIn(page, username, password);
    await awaitAdminShell(page, username);
    secret = await setUpTwoFactorOnPage(page);

    await expectSignedInAs(page, username);
    // The page's Unset button says the screen believed it; this says the appliance does.
    expect((await findUser(api, username))?.twofactor_auth_configured).toBe(true);
    await signOut(page);
  });

  // Before the right code, so a prompt that let anything through cannot pass as
  // one that checks.
  await test.step('signing in again asks for a code, and refuses a wrong one', async () => {
    await submitSignIn(page, username, password);
    await submitOneTimePassword(page, wrongTotpCode(secret));

    await expect(page.locator(signinLocators.error)).toContainText(wrongCodeMessage);
    await expect(page.locator(adminLayout)).toBeHidden();
  });

  await test.step('the code the secret gives now lets them in', async () => {
    // Loaded afresh, unlike the other sign-ins, so this is a new attempt from a
    // clean page. Signing in from the form the refusal left is two-factor-signin's.
    await attemptSignIn(page, username, password);
    await submitOneTimePassword(page, totpCode(secret));

    await awaitAdminShell(page, username);
    await expectSignedInAs(page, username);
    await signOut(page);
  });

  await test.step('an admin clears it from the user details', async () => {
    // Off again first, over the API. The suite's admin has no secret, so with it
    // on they would be put through the setup dialog themselves, and they must
    // never be given one. Clear Two-Factor Authentication is offered whatever
    // the global setting, so nothing about the claim below changes.
    await disableGlobalTwoFactor(api, foundBaseline());

    await submitSignIn(page, config.username, config.password);
    await awaitAdminShell(page, config.username);
    await clearTwoFactorFromUserDetails(page, username);

    expect((await findUser(api, username))?.twofactor_auth_configured).toBe(false);
  });
});
