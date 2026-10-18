/**
 * Story: an admin opens the Dashboard and the System Information widget describes this appliance.
 *
 * The widget is the first one in the default layout. It reads its hostname and version from
 * `webui.main.dashboard.sys_info` when the page loads, and each is checked against what
 * `system.info` reports, a separate call carrying the same fields. Uptime is not checked: it
 * moves every second.
 *
 * The layout is the admin's own (`dashState` on the account). `dashboard-widgets.e2e.ts` changes
 * it, and writes it back after every test. On an appliance where someone has taken the widget off
 * their dashboard this fails at its first assertion, which names the readout it could not find.
 *
 * Nothing is created, so there is no teardown.
 *
 * Does not need a pool, so it does not ask for the `pool` fixture: nothing System Information
 * shows comes from storage, and the Dashboard renders its cards whether or not the appliance has
 * one.
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
