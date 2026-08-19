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
 * independently meaningful: "sign out" and "sign in as the new account" only
 * say anything in sequence. That is a different case from S3–S8, where each
 * step is a feature in its own right and gets API-provisioned preconditions
 * (R3.1).
 */
import { ensureUserAbsent, testAdmin } from '../../fixtures/users';
import { expectSignedInAs, signIn, signOut } from '../../flows/auth';
import { createTrueNasAdminUser } from '../../flows/users';
import { topbarLocators } from '../../locators/topbar';
import { expect, test } from '../../support/fixtures';

/**
 * Removed before the test as well as after it, so an interrupted run leaves the
 * next one able to start (R3.5). The `api` fixture is worker-scoped, so both
 * hooks share one connection rather than paying a sign-in each — middleware
 * rate-limits unauthenticated calls at 20 per method per IP per 60 seconds
 * (`RateLimitConfig`) and connections are what spend that budget.
 */
test.beforeEach(async ({ api }) => {
  await ensureUserAbsent(api, testAdmin.username);
});

/**
 * `TN_KEEP_TEST_DATA=1` leaves the created user on the appliance so it can be
 * inspected after a run. Cleanup still happens in `beforeEach`, so the next run
 * is unaffected — this only changes what is left behind, never what a run finds.
 */
const keepTestData = process.env.TN_KEEP_TEST_DATA === '1';

test.afterEach(async ({ api }) => {
  if (keepTestData) {
    console.warn(`TN_KEEP_TEST_DATA=1 — leaving user "${testAdmin.username}" on the appliance.`);
    return;
  }
  await ensureUserAbsent(api, testAdmin.username);
});

test('an admin creates a TrueNAS admin user who can then sign in', async ({ page, config }) => {
  await test.step('sign in as the existing administrator', async () => {
    await signIn(page, config.username, config.password);
    await expectSignedInAs(page, config.username);
  });

  await test.step(`create a TrueNAS admin user named ${testAdmin.username}`, async () => {
    await createTrueNasAdminUser(page, testAdmin);
  });

  await test.step('sign out', async () => {
    await signOut(page);
  });

  await test.step(`sign in as ${testAdmin.username}`, async () => {
    await signIn(page, testAdmin.username, testAdmin.password);
    await expectSignedInAs(page, testAdmin.username);
  });

  // Guards against the session simply having been carried over: the new account
  // must be who the app thinks is signed in, not merely *someone*.
  await expect(page.locator(topbarLocators.userMenu)).not.toContainText(config.username);
});
