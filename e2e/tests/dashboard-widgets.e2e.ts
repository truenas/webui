/**
 * Story: an admin opens the Dashboard and sees the default cards, and the CPU, storage and network
 * cards describe this appliance.
 *
 * The layout is the admin's own `dashState` attribute. Each test writes the layout it needs over
 * the API, and `afterEach` writes back the one the account had, because `tests/dashboard.e2e.ts`
 * runs on whatever layout it finds and relies on it holding System Information. See
 * `fixtures/dashboard.ts`.
 *
 * `DashboardStore` reads the layout from the account the app loaded at sign-in, and the `page`
 * fixture signs in before a test writes anything. So each test reloads after opening the
 * Dashboard, which makes the app read `auth.me` again.
 *
 * Values that move on their own are not checked: CPU usage, temperatures, traffic rates, uptime,
 * and the memory total, which comes from `reporting.realtime` rather than from `system.info`.
 */
import {
  captureDashState, readDashState, readFirstNicName, readNicWithIpv4, readShownPool, restoreDashState, writeDashState,
} from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import { readCpuModel } from '../fixtures/system-info';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { expect, test } from '../support/fixtures';

/** Each widget waits on its own API call before it renders. */
const widgetLoadTimeoutMs = 30_000;

/**
 * The layout the account had before the first test in this file changed it.
 *
 * Captured once rather than in every `beforeEach`. If a restore failed, a second capture would
 * record this file's own layout as the admin's, and the next restore would keep it.
 */
let captured: CapturedDashState | undefined;

test.beforeEach(async ({ api }) => {
  captured ??= await captureDashState(api);
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and there is then nothing to
  // restore. Writing `undefined` would be serialized as `null` over the admin's layout.
  if (captured) {
    await restoreDashState(api, captured);
  }
});

test('an admin with no saved layout opens the Dashboard, and every default card is there', async ({
  page, api,
}) => {
  await writeDashState(api, null);
  const nicName = await readFirstNicName(api);

  await goToDashboard(page);
  await page.reload();

  const defaultCards: [string, string][] = [
    ['System Information', dashboardLocators.systemInfo.hostname],
    ['CPU Usage bar', dashboardLocators.cpuUsageBar.title],
    ['CPU Temperature bar', dashboardLocators.cpuTemperatureBar.title],
    ['CPU Usage gauge', dashboardLocators.cpuUsageGauge.title],
    ['CPU Model', dashboardLocators.cpuModel.title],
    ['CPU Recent Usage', dashboardLocators.cpuUsageRecent.title],
    ['Memory', dashboardLocators.memory.title],
    ['Storage', dashboardLocators.storage.reports],
    ['Backup Tasks', dashboardLocators.backupTasks.title],
    ['IPv4 Address', dashboardLocators.ipv4Address.title(nicName)],
    ['Interface', dashboardLocators.interface.name(nicName)],
    ['Help', dashboardLocators.help.documentation],
  ];
  for (const [card, locator] of defaultCards) {
    await expect(page.locator(locator), `the ${card} card`).toBeVisible({ timeout: widgetLoadTimeoutMs });
  }
  await expect(page.locator(dashboardLocators.configure)).toBeVisible();

  // Rendering the default layout must not save it as the admin's own.
  expect(await readDashState(api)).toBeNull();
});

test('an admin opens the Dashboard, and the CPU, storage and network cards show what the appliance reports', async ({
  page, api, pool,
}) => {
  const nic = await readNicWithIpv4(api);
  const layout: DashboardGroup[] = [
    { layout: 'full', slots: [{ type: 'cpu-model-widget' }] },
    { layout: 'full', slots: [{ type: 'storage' }] },
    {
      layout: 'halves',
      slots: [
        { type: 'ipv4-address', settings: { interface: nic.name } },
        { type: 'interface', settings: { interface: nic.name } },
      ],
    },
  ];
  await writeDashState(api, layout);

  const cpuModel = await readCpuModel(api);
  // The fixture's pool, unless the appliance lists six others before it and the card has no tile
  // for it.
  const shownPool = await readShownPool(api, pool);

  await goToDashboard(page);
  await page.reload();

  await expect(page.locator(dashboardLocators.cpuModel.value)).toHaveText(cpuModel, { timeout: widgetLoadTimeoutMs });

  // The widget writes the raw status, except for a pool that is ONLINE and not healthy.
  const expectedPoolStatus = shownPool.status === 'ONLINE' && !shownPool.healthy ? 'Unhealthy' : shownPool.status;
  await expect(page.locator(dashboardLocators.storage.poolName(shownPool.name))).toHaveText(shownPool.name, {
    timeout: widgetLoadTimeoutMs,
  });
  await expect(page.locator(dashboardLocators.storage.poolStatus(shownPool.name))).toHaveText(expectedPoolStatus);

  await expect(page.locator(dashboardLocators.interface.name(nic.name))).toHaveText(nic.name, {
    timeout: widgetLoadTimeoutMs,
  });
  // `linkStateLabelMap` labels `LINK_STATE_UP` as `LINK STATE UP`, and so on for the other two.
  await expect(page.locator(dashboardLocators.interface.linkState(nic.name)))
    .toHaveText(nic.linkState.replaceAll('_', ' '), { timeout: widgetLoadTimeoutMs });

  // Joined with newlines in the card; `toHaveText` compares with whitespace collapsed.
  await expect(page.locator(dashboardLocators.ipv4Address.value(nic.name)))
    .toHaveText(nic.ipv4Addresses.join('\n'), { timeout: widgetLoadTimeoutMs });
});
