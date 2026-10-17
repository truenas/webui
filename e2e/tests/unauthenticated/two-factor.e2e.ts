/**
 * Story: an admin turns two-factor authentication on for the appliance; an
 * account signing in next sets it up on the Two-Factor Authentication page it
 * lands on; from then on it is asked for a code, which lets it in when right and
 * not when wrong; and an admin can clear it again from that user's details.
 *
 * It lands on that page because the sign-in returns to the route the admin
 * signed out from. The full-screen setup dialog other routes raise is covered by
 * `two-factor-setup.e2e.ts`, not here.
 *
 * Under `tests/unauthenticated/` because every claim here is about signing in,
 * which the token bypass would skip (R4.2). One test, with the story as steps,
 * because each step needs the state the last one left — and every sign-in spends
 * from the unauthenticated rate limit (20 per method per IP per 60s).
 *
 * The sign-in page spends from it too: each time it starts it asks
 * `system.advanced.login_banner` and `user.has_local_administrator_set_up`, and
 * signing out starts it. So after a sign-out the next sign-in fills the form
 * already on screen rather than loading the page again, which would spend both a
 * second time. Run close behind `signin.e2e.ts`, loading it every time put the
 * last sign-in over the limit. `two-factor-setup.e2e.ts` now sorts between the
 * two, with one sign-in per test and slow two-factor saves around each.
 *
 * Codes come from `support/totp.ts`, computed from the secret the
 * `/two-factor-auth` page shows, which is what an authenticator app does with it.
 *
 * Global two-factor is the dangerous part. Left on, it puts every account with
 * no secret — the suite's own admin included — through the setup dialog at its
 * next sign-in, so every later spec would fail. It is turned off before the test
 * and after it, in `afterAll`, whatever happened. The suite's own admin is never
 * given a secret: the API client cannot answer a code prompt.
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
const wrongCodeMessage = 'Incorrect or expired OTP. Please try again.';

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
    // Loaded afresh, unlike the other sign-ins: the refusal left the form on its
    // code step, and this is a new attempt from the username.
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
