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
 * The test writes a layout holding one System Information card and `afterEach` writes back the
 * admin's own, as `dashboard-links.e2e.ts` does and for the same reason. See `fixtures/dashboard.ts`.
 * Nothing is installed and the train and profile are not touched, so there is nothing else to
 * restore.
 *
 * If an update is running, the card shows Update in Progress instead of this button. That is not a
 * state the CI appliance is in.
 */
import { captureDashState, restoreDashState, writeDashState } from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import { readUpdateState } from '../fixtures/update';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { updateLocators } from '../locators/update';
import { apiCallsTo } from '../support/api-calls';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

const updateStatusMethod = 'update.status';

/** `update.status` asks the update server before it answers the card. */
const updateCheckTimeoutMs = 60_000;

/** The Update page loads its config and runs the update check before it settles. */
const updatePageTimeoutMs = 60_000;

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

test.beforeEach(async ({ page, api }) => {
  captured ??= await captureDashState(api);
  await writeDashState(api, layout);

  await goToDashboard(page);
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and there is then nothing to
  // restore. Writing `undefined` would be serialized as `null` over the admin's layout.
  if (captured) {
    await restoreDashState(api, captured);
  }
});

test('the System Information card and the Update page agree with update.status', async ({ page, api }) => {
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
