/**
 * Story: an administrator creates a TrueNAS admin user, who can then sign in.
 *
 * This is the first test that covers a real user journey rather than proving
 * the rig. It deliberately runs without the token bypass — it lives under
 * `tests/unauthenticated/`, which has no `storageState` and no dependency on
 * the setup project, because a test of authentication that authenticates by
 * side channel tests nothing (R4.2).
 *
 * The journey is one test rather than four because the steps are not
 * independently meaningful: "sign out" and "sign in as bob" only say anything
 * in sequence. That is a different case from S3–S8, where each step is a
 * feature in its own right and gets API-provisioned preconditions (R3.1).
 */
import { ensureUserAbsent } from '../../fixtures/users';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import { createTrueNasAdminUser } from '../../flows/users';
import { topbarLocators } from '../../locators/topbar';
import { expect, test } from '../../support/fixtures';

const bob = {
  username: 'bob',
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: 'Bob-E2E-Passw0rd!',
};

/**
 * Fixed rather than run-scoped, which departs from R3.3.
 *
 * Justified here: the nightly gets a fresh VM per run, and execution is serial
 * against a single appliance (R3.4), so there is no concurrent run to collide
 * with. The cost is real but narrow — two developers running against the *same*
 * shared dev VM at once would clash. The idempotent cleanup below keeps the
 * test re-runnable against a dirty box regardless (R3.5).
 */
/**
 * One API connection for the whole file.
 *
 * Each connection costs a sign-in, and middleware rate-limits unauthenticated
 * calls at 20 per method per IP per 60 seconds (`RateLimitConfig`), with
 * authenticated calls exempt. Connecting per hook spent three sign-ins per run
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, bob.username);
});

/**
 * `TN_KEEP_TEST_DATA=1` leaves the created user on the appliance so it can be
 * inspected after a run. Cleanup still happens in `beforeEach`, so the next run
 * is unaffected — this only changes what is left behind, never what a run finds.
 */
const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving user "${bob.username}" on the appliance.`);
    return;
  }
  await ensureUserAbsent(api, bob.username);
});

test('an admin creates a TrueNAS admin user who can then sign in', async ({ page, config }) => {
  await test.step('sign in as the existing administrator', async () => {
    await signIn(page, config.username, config.password);
    await expectSignedInAs(page, config.username);
  });

  await test.step('create a TrueNAS admin user named bob', async () => {
    await createTrueNasAdminUser(page, bob);
  });

  await test.step('sign out', async () => {
    await signOut(page);
  });

  await test.step('sign in as bob', async () => {
    await signIn(page, bob.username, bob.password);
    await expectSignedInAs(page, bob.username);
  });

  // Guards against the session simply having been carried over: bob must be
  // who the app thinks is signed in, not merely *someone*.
  await expect(page.locator(topbarLocators.userMenu)).not.toContainText(config.username);
});
