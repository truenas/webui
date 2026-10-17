/**
 * Stories: an admin reads another user's two-factor state on that user's Access
 * card on Credentials > Users, and clears it for a user who has it.
 *
 * The recovery path for a user who has lost their authenticator, and the one
 * two-factor journey the suite's own admin performs. `unauthenticated/two-factor.e2e.ts`
 * ends by clearing a secret too, but with global two-factor off, where the card
 * shows no two-factor line at all. These run with it on, which is when the card
 * says whether the user has it.
 *
 * Each claim is asserted twice: the card says the screen believed it,
 * `user.query` says the appliance holds it.
 *
 * Global two-factor is turned on over the API after the token sign-in and the
 * setup dialog it raises is skipped, as `two-factor-global.e2e.ts` does, so the
 * suite's admin is never given a secret. It is turned off before each test and
 * after it, unconditionally and deliberately not skipped under
 * `TN_KEEP_TEST_DATA`: left on, every later spec would open behind that dialog.
 */
import {
  armTwoFactorSecret, disableGlobalTwoFactor, readGlobalTwoFactor, type GlobalTwoFactorConfig,
} from '../fixtures/two-factor';
import {
  ensureSignInCapableUser, ensureUserAbsent, ensureUserPresent, findUser,
} from '../fixtures/users';
import { clearTwoFactorOnAccessCard, startWithGlobalTwoFactorOn } from '../flows/two-factor';
import { openUserDetails } from '../flows/users';
import { twoFactorLocators } from '../locators/two-factor';
import { leavingTestData, runCleanupSteps, type CleanupStep } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/**
 * Throwaway accounts nobody signs in as. No letter-digit boundary in either
 * name, so the list row's lodash id and the card's library ids agree.
 */
const withTwoFactor = {
  username: 'otpclear',
  /**
   * A password, unlike {@link withoutTwoFactor}, so that arming a secret does
   * not depend on middleware accepting one for a password-disabled account.
   * Meets the appliance's complexity rules; not a credential of any real account.
   */
  password: 'OtpClear-E2E-Passw0rd!',
};
const withoutTwoFactor = 'otpnone';

const hasTwoFactor = 'Has Two-Factor Authentication';
const noTwoFactor = 'No Two-Factor Authentication';

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

/** Deleting an account is also what removes its secret. */
test.beforeEach(async ({ page, api }) => {
  await disableGlobalTwoFactor(api, foundBaseline());
  await ensureUserAbsent(api, withTwoFactor.username);
  await ensureUserAbsent(api, withoutTwoFactor);

  await ensureSignInCapableUser(api, withTwoFactor.username, { password: withTwoFactor.password, groups: [] });
  await ensureUserPresent(api, withoutTwoFactor);
  await armTwoFactorSecret(api, withTwoFactor.username);

  await startWithGlobalTwoFactorOn(page, api, 1);
});

/** Global two-factor first, and whatever happens to the users. */
test.afterEach(async ({ api }) => {
  const steps: CleanupStep[] = [
    ['turn global two-factor off', () => disableGlobalTwoFactor(api, foundBaseline())],
  ];
  if (!leavingTestData(`users "${withTwoFactor.username}" and "${withoutTwoFactor}"`)) {
    steps.push(
      [`delete user "${withTwoFactor.username}"`, () => ensureUserAbsent(api, withTwoFactor.username)],
      [`delete user "${withoutTwoFactor}"`, () => ensureUserAbsent(api, withoutTwoFactor)],
    );
  }

  await runCleanupSteps(steps);
});

test('an admin sees that a user has two-factor, clears it, and the appliance drops it', async ({ page, api }) => {
  const { username } = withTwoFactor;
  const status = page.locator(twoFactorLocators.userStatus(username));
  const clear = page.locator(twoFactorLocators.clearTwoFactor(username));

  await openUserDetails(page, username);
  await expect(status).toHaveText(hasTwoFactor);
  await expect(clear).toBeVisible();

  await clearTwoFactorOnAccessCard(page, username);

  await expect(status).toHaveText(noTwoFactor);
  await expect(clear).toBeHidden();
  expect((await findUser(api, username))?.twofactor_auth_configured).toBe(false);
});

test('a user without two-factor offers nothing to clear or set up', async ({ page, api }) => {
  await openUserDetails(page, withoutTwoFactor);
  // The two-factor line renders only while global two-factor is on, so reading
  // it is what makes the absences below about this user rather than the setting.
  await expect(page.locator(twoFactorLocators.userStatus(withoutTwoFactor))).toHaveText(noTwoFactor);
  await expect(page.locator(twoFactorLocators.clearTwoFactor(withoutTwoFactor))).toBeHidden();
  await expect(page.locator(twoFactorLocators.setUpLink(withoutTwoFactor))).toBeHidden();

  expect((await findUser(api, withoutTwoFactor))?.twofactor_auth_configured).toBe(false);
});
