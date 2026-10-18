/**
 * Story: an admin on the Dashboard sees the System Information card say whether an update is
 * offered, and the Update page it opens says the same.
 *
 * The CI appliance reaches the real update server, whose answer moves with every nightly. So the
 * test does not hard-code either state: it reads `update.status` first and asserts the card and the
 * page agree with it. Which branch runs depends on the update server on the day. Both are real code
 * paths and nothing is stubbed.
 *
 * The card shows Check for Updates until its own `update.status` answers, so that label alone
 * would pass before the card knew anything. The test waits for the card's call to be answered
 * before reading it. Hence `recordApiCalls`.
 *
 * The test switches the update profile to Developer first. Middleware offers a release only when
 * the release's profile is at least as permissive as the configured one, and on the CI appliance
 * the configured profile matches nothing on the next train: `update.status` answered `ERROR` "No
 * releases match specified update profile." on every run, so the test never ran. Developer is the
 * least conservative profile and matches every release. It changes which release is offered, not
 * whether the card and the page agree about it.
 *
 * The test writes a layout holding one System Information card and `afterEach` writes back the
 * admin's own, as `dashboard-links.e2e.ts` does and for the same reason. See `fixtures/dashboard.ts`.
 * `afterEach` also writes back the profile the appliance held. Nothing is installed and the train
 * is not touched.
 *
 * If an update is running, the card shows Update in Progress instead of this button. That is not a
 * state the CI appliance is in.
 *
 * Does not need a pool, so it does not ask for the `pool` fixture: System Information and the Update
 * page's update check show nothing from storage.
 */
import { captureDashState, restoreDashState, writeDashState } from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import {
  isUpdateProfileAvailable,
  readUpdateProfile,
  readUpdateState,
  setUpdateProfile,
} from '../fixtures/update';
import type { UpdateProfile } from '../fixtures/update';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { updateLocators } from '../locators/update';
import { apiCallsTo } from '../support/api-calls';
import { runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

const updateStatusMethod = 'update.status';

/** `update.status` asks the update server before it answers the card. */
const updateCheckTimeoutMs = 60_000;

/** The Update page loads its config and runs the update check before it settles. */
const updatePageTimeoutMs = 60_000;

/** The least conservative profile: every release matches it. */
const developerProfile = 'DEVELOPER';

const layout: DashboardGroup[] = [
  { layout: 'full', slots: [{ type: 'system-info-active' }] },
];

/**
 * The layout the account had before the first test in this file changed it.
 *
 * Captured once rather than in every `beforeEach`. If a restore failed, a second capture would
 * record this file's own layout as the admin's, and the next restore would keep it.
 */
let captured: CapturedDashState | undefined;

/** The update profile the appliance held before the first test in this file changed it. Same reasoning. */
let startingProfile: UpdateProfile | undefined;

test.beforeEach(async ({ page, api }) => {
  captured ??= await captureDashState(api);
  startingProfile ??= await readUpdateProfile(api);
  await writeDashState(api, layout);

  await goToDashboard(page);
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and there is then nothing to
  // restore. Writing `undefined` would be serialized as `null` over the admin's settings.
  await runCleanupSteps([
    ['restore the dashboard layout', async () => {
      if (captured) {
        await restoreDashState(api, captured);
      }
    }],
    ['restore the update profile', async () => {
      if (startingProfile !== undefined && await readUpdateProfile(api) !== startingProfile) {
        await setUpdateProfile(api, startingProfile);
      }
    }],
  ]);
});

test('the System Information card and the Update page agree with update.status', async ({ page, api }) => {
  // Middleware refuses a profile that is not available, e.g. on a Mission Critical entitlement.
  test.skip(
    !await isUpdateProfileAvailable(api, developerProfile),
    `the ${developerProfile} update profile is not available on this appliance`,
  );
  await setUpdateProfile(api, developerProfile);

  const { code, newVersion, error } = await readUpdateState(api);
  // Without an answer from the update server neither state is true: the card falls back to
  // Check for Updates and the page shows the error. Asserting either would test the network.
  test.skip(
    code !== 'NORMAL',
    `update.status could not check for updates (${code}): ${error ?? 'no reason given'}`,
  );

  // `DashboardStore` read the layout at sign-in, before it was written here. The calls made before
  // the reload belong to the admin's own layout, so only the ones after it are the card's.
  const callsBefore = apiCallsTo(page, updateStatusMethod).length;
  await page.reload();
  const cardAnswers = (): (string | undefined)[] => (
    apiCallsTo(page, updateStatusMethod).slice(callsBefore).map((call) => call.answer)
  );
  await expect.poll(cardAnswers, { timeout: updateCheckTimeoutMs }).toContain('result');

  const updateButton = page.locator(dashboardLocators.systemInfo.update);
  await expect(updateButton).toHaveText(newVersion ? 'Updates Available' : 'Check for Updates');

  await updateButton.click();
  await expect(page).toHaveURL(/\/system\/update$/);

  if (newVersion) {
    await expect(page.locator(updateLocators.updateVersion)).toHaveText(newVersion, { timeout: updatePageTimeoutMs });
    await expect(page.locator(updateLocators.upToDate)).toHaveCount(0);
  } else {
    await expect(page.locator(updateLocators.upToDate)).toBeVisible({ timeout: updatePageTimeoutMs });
    await expect(page.locator(updateLocators.updateVersion)).toHaveCount(0);
  }
});
