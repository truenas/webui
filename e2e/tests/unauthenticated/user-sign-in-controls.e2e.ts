/**
 * Stories: an admin locks a user from the user details page and that user can
 * no longer sign in, unlocks them and they can again; and an admin generates a
 * one-time password that signs the user in exactly once.
 *
 * Under `tests/unauthenticated/` because the claim is about signing in as the
 * account afterwards, which the token bypass would defeat (R4.2). The admin
 * signs in through the form too, and every sign-in spends from the
 * unauthenticated rate limit (20 per method per IP per 60s) — which is why each
 * story is one test and the steps run in sequence rather than as separate tests.
 *
 * Each runs against a throwaway administrator, never the suite's own admin: a
 * lock that failed to come off again would otherwise take every later test's
 * sign-in down with it. The account is an administrator because a one-time
 * password needs a user holding a role, and signing in to the UI needs one too.
 *
 * `locked` is read back over the API after each toggle: the card swapping its
 * button says the screen believed it, `user.query` says the appliance did.
 */
import { ensureSignInAdministratorPresent, ensureUserAbsent, findUser } from '../../fixtures/users';
import {
  attemptSignIn, expectOneTimePasswordSession, expectSignedInAs, expectSignInRefused, signIn, signOut,
  wrongCredentialsMessage,
} from '../../flows/auth';
import { generateOneTimePassword, lockUser, openUserDetails, unlockUser } from '../../flows/users';
import { leavingTestData } from '../../support/cleanup';
import { expect, test } from '../../support/fixtures';

/** The account the lock story locks and unlocks. */
const lockTarget = {
  username: 'locktarget',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'Lock-E2E-Passw0rd!',
};

/** The account the one-time password story hands a password to. */
const otpTarget = {
  username: 'otptarget',
  /** Its own password, which the story never uses: the one-time password is the point. */
  password: 'Otp-E2E-Passw0rd!',
};

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start (R3.5). Deleting the account is also what clears a lock
 * a failed test left on it.
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, lockTarget.username);
  await ensureUserAbsent(api, otpTarget.username);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`users "${lockTarget.username}" and "${otpTarget.username}"`)) {
    return;
  }
  await ensureUserAbsent(api, lockTarget.username);
  await ensureUserAbsent(api, otpTarget.username);
});

test('a locked user is refused at sign-in, and unlocking lets them back in', async ({ page, api, config }) => {
  await ensureSignInAdministratorPresent(api, lockTarget);

  await test.step('an admin locks the user from the Access card', async () => {
    await signIn(page, config.username, config.password);
    await openUserDetails(page, lockTarget.username);
    await lockUser(page, lockTarget.username);

    expect((await findUser(api, lockTarget.username))?.locked).toBe(true);
    await signOut(page);
  });

  await test.step('the locked user is refused, with the right password', async () => {
    await attemptSignIn(page, lockTarget.username, lockTarget.password);
    await expectSignInRefused(page, wrongCredentialsMessage);
  });

  await test.step('an admin unlocks the user', async () => {
    await signIn(page, config.username, config.password);
    await openUserDetails(page, lockTarget.username);
    await unlockUser(page, lockTarget.username);

    expect((await findUser(api, lockTarget.username))?.locked).toBe(false);
    await signOut(page);
  });

  // The other half of the claim. Without it the refusal above would pass for an
  // account the lock had broken some other way — a password the toggle reset,
  // say — and that is no lock at all.
  await test.step('the unlocked user signs in', async () => {
    await signIn(page, lockTarget.username, lockTarget.password);
    await expectSignedInAs(page, lockTarget.username);
  });
});

test('a one-time password signs the user in once, and only once', async ({ page, api, config }) => {
  await ensureSignInAdministratorPresent(api, otpTarget);

  let oneTimePassword = '';

  await test.step('an admin generates a one-time password from the Password card', async () => {
    await signIn(page, config.username, config.password);
    await openUserDetails(page, otpTarget.username);
    oneTimePassword = await generateOneTimePassword(page, otpTarget.username);

    // Compared as a boolean so a failure never prints a credential into the report.
    expect(oneTimePassword.length > 0, 'the dialog showed an empty password').toBe(true);
    await signOut(page);
  });

  await test.step('the user signs in with it', async () => {
    await attemptSignIn(page, otpTarget.username, oneTimePassword);
    await expectOneTimePasswordSession(page, otpTarget.username);
  });

  // "One-time" is the claim. A password that kept working would pass every
  // step above.
  await test.step('the same password is refused the second time', async () => {
    await attemptSignIn(page, otpTarget.username, oneTimePassword);
    await expectSignInRefused(page, wrongCredentialsMessage);
  });
});
