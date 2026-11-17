/**
 * Story: the Dashboard's System Information card says whether an update is offered, and the Update page agrees.
 * The real update server's answer moves nightly, so the test reads `update.status` and asserts both agree with it;
 * it waits for the card's own call (`recordApiCalls`), as Check for Updates shows before the card knows anything.
 * The profile is switched to Developer, which matches every release: CI's configured one matched nothing and
 * `update.status` errored. `afterEach` restores the profile and the admin's layout (see `fixtures/dashboard.ts`).
 * A running update (Update in Progress) is not a state CI is in. No pool needed.
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
