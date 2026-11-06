/**
 * Story: an admin opens the Dashboard and the System Information widget describes this appliance: hostname and
 * version are checked against `system.info`, a separate call; uptime moves and is not checked. The layout is the
 * admin's own `dashState`, which `dashboard-widgets.e2e.ts` changes and restores; if someone removed the widget,
 * the first assertion fails naming the readout. Nothing is created, and no pool is needed.
 */
import { readSystemIdentity } from '../fixtures/system-info';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { expect, test } from '../support/fixtures';

/** The widget waits on its own API call before it renders a value. */
const widgetLoadTimeoutMs = 30_000;

test('an admin opens the Dashboard, and System Information shows this appliance', async ({ page, api }) => {
  const identity = await readSystemIdentity(api);

  await goToDashboard(page);

  await expect(page.locator(dashboardLocators.systemInfo.hostname))
    .toHaveText(identity.hostname, { timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.systemInfo.version)).toHaveText(identity.version);
});
