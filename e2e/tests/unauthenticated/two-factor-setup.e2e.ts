/**
 * Stories: a user with no secret signing in while global two-factor is on gets the setup dialog, and sets it up (a
 * wrong code refused, the right one finishing) or skips it, arming nothing. The guard holds navigation until the
 * dialog closes: Skip closes it with `true` so the route lands, but Finish with no value, so after Finish only the
 * dialog closing is asserted. One sign-in per test for the rate limit. Global two-factor is set over the API and
 * turned off before and after each test, unconditionally and not skipped under `TN_KEEP_TEST_DATA`, or every later
 * secretless account would hit this dialog. Codes use `applianceNow` and are never quoted in an assertion.
 */
import {
  disableGlobalTwoFactor, ensureTwoFactorUserPresent, readGlobalTwoFactor, setGlobalTwoFactor, twoFactorUser,
  type GlobalTwoFactorConfig,
} from '../../fixtures/two-factor';
import { ensureUserAbsent, findUser } from '../../fixtures/users';
import { attemptSignIn, awaitAdminShell, expectSignedInAs } from '../../flows/auth';
import { confirmTwoFactorCode, generateTwoFactorSecret, skipTwoFactorSetupPrompt } from '../../flows/two-factor';
import { twoFactorLocators } from '../../locators/two-factor';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../../support/cleanup';
import { expect, test } from '../../support/fixtures';
import { applianceNow, totpCode, wrongTotpCode } from '../../support/totp';

const dialogTimeoutMs = 60_000;

/** The start of what the code field says for a code that does not match (`helptext2fa.verification.invalid`). */
const wrongCodeMessage = 'That code does not match this secret.';

/**
 * One step either side of now, so a code computed just before a 30-second
 * boundary is still accepted once it reaches the card.
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
});

test.afterEach(async ({ api }) => {
  // Never kept: unlike an object left behind to inspect, global two-factor left
  // on puts every later sign-in behind the setup dialog.
  const steps: CleanupStep[] = [
    ['turn global two-factor off', () => disableGlobalTwoFactor(api, foundBaseline())],
  ];
  if (!leavingTestData(`user "${twoFactorUser.username}"`)) {
    steps.push(['delete the user, and its secret with it', () => ensureUserAbsent(api, twoFactorUser.username)]);
  }
  await runCleanupSteps(steps);
});

test('a user sets up two-factor in the dialog at first sign-in, and a wrong code does not get past it', async ({
  page, api,
}) => {
  const { username, password } = twoFactorUser;
  const { setupDialog, setup } = twoFactorLocators;
  let secret = '';

  await test.step('signing in raises the setup dialog, and it generates a secret', async () => {
    await attemptSignIn(page, username, password);
    await expect(page.locator(setupDialog.title)).toBeVisible({ timeout: dialogTimeoutMs });

    secret = await generateTwoFactorSecret(page);
  });

  // Before the right code, so a check that let anything through cannot pass as
  // one that checks.
  await test.step('a wrong code is refused, and Finish is not offered', async () => {
    await confirmTwoFactorCode(page, wrongTotpCode(secret, await applianceNow(api)));

    await expect(page.locator(setup.codeField)).toContainText(wrongCodeMessage);
    // After the refusal has rendered, so this is read once the press has had its answer.
    await expect(page.locator(setupDialog.finish)).toBeHidden();
  });

  await test.step('the code the secret gives now is accepted, and Finish closes the dialog', async () => {
    await confirmTwoFactorCode(page, totpCode(secret, await applianceNow(api)));

    const finish = page.locator(setupDialog.finish);
    await expect(finish).toBeVisible({ timeout: dialogTimeoutMs });
    await finish.click();
    await expect(page.locator(setupDialog.title)).toBeHidden({ timeout: dialogTimeoutMs });
  });

  // Middleware arms the secret when it is generated, so this says the account
  // holds one; Finish appearing only for the right code is what says the screen
  // checked it.
  expect((await findUser(api, username))?.twofactor_auth_configured).toBe(true);
});

test('a user skips two-factor setup at first sign-in, and nothing is armed', async ({ page, api }) => {
  const { username, password } = twoFactorUser;

  await attemptSignIn(page, username, password);
  await skipTwoFactorSetupPrompt(page);

  // The navigation the dialog held lands once it closes.
  await awaitAdminShell(page, username);
  await expectSignedInAs(page, username);

  // Skipping generates nothing; a skip that armed a secret anyway would lock the
  // user out at their next sign-in.
  expect((await findUser(api, username))?.twofactor_auth_configured).toBe(false);
});
