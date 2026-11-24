/**
 * Story: an admin presses a Dashboard card's chart button (CPU Overview, Memory, Storage, Interface, System
 * Information) and lands on that card's Reporting tab. CPU Overview is not in the default layout and Interface
 * shows its button only at full size, so each test writes a layout with all five full-size and reloads;
 * `afterEach` restores the account's (see `fixtures/dashboard.ts`). Report titles come from
 * `reporting.netdata_graphs`, since report ids are keyed by them; the Disk tab is checked by its Devices picker.
 * Only the Storage test uses the `pool` fixture, so its card has a tile to wait for.
 */
import type { Page } from '@playwright/test';
import {
  captureDashState, readDashboardNicNames, readFirstNicName, readShownPool, restoreDashState, writeDashState,
} from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import { findFirstGraphIdentifier, findGraphTitle, findGraphTitleFor } from '../fixtures/reporting';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { reportingLocators } from '../locators/reporting';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/** Each widget waits on its own API call before it renders. */
const widgetLoadTimeoutMs = 30_000;

/** The Reporting page reads `reporting.netdata_graphs` before it draws a tab. */
const reportLoadTimeoutMs = 30_000;

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

/**
 * Writes the five cards, each in a full-size group, and opens the Dashboard on them.
 *
 * The Interface card is set to show `nic`, or the first NIC webui lists when none is given.
 */
async function openDashboardWithReportCards(page: Page, api: E2eApiClient, nic?: string): Promise<void> {
  const cardNic = nic ?? await readFirstNicName(api);
  const layout: DashboardGroup[] = [
    { layout: 'full', slots: [{ type: 'system-info-active' }] },
    { layout: 'full', slots: [{ type: 'cpu' }] },
    { layout: 'full', slots: [{ type: 'memory' }] },
    { layout: 'full', slots: [{ type: 'storage' }] },
    { layout: 'full', slots: [{ type: 'interface', settings: { interface: cardNic } }] },
  ];
  await writeDashState(api, layout);

  await goToDashboard(page);
  await page.reload();
}

async function clickReportButton(page: Page, button: string): Promise<void> {
  const locator = page.locator(button);
  await expect(locator).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await locator.click();
}

function requireGraphTitle(title: string | undefined, graph: string): string {
  if (!title) {
    throw new Error(`reporting.netdata_graphs offers no "${graph}" graph, so its tab has nothing to draw.`);
  }

  return title;
}

test('the CPU card\'s report button opens the CPU tab', async ({ page, api }) => {
  const title = requireGraphTitle(await findGraphTitle(api, 'cpu'), 'cpu');
  await openDashboardWithReportCards(page, api);

  await clickReportButton(page, dashboardLocators.reportButtons.cpu);

  await expect(page).toHaveURL(/\/reportsdashboard\/cpu$/);
  await expect(page.locator(reportingLocators.title(title))).toBeVisible({ timeout: reportLoadTimeoutMs });
});

test('the Memory card\'s report button opens the Memory tab', async ({ page, api }) => {
  const title = requireGraphTitle(await findGraphTitle(api, 'memory'), 'memory');
  await openDashboardWithReportCards(page, api);

  await clickReportButton(page, dashboardLocators.reportButtons.memory);

  await expect(page).toHaveURL(/\/reportsdashboard\/memory$/);
  await expect(page.locator(reportingLocators.title(title))).toBeVisible({ timeout: reportLoadTimeoutMs });
});

test('the Storage card\'s report button opens the Disk tab', async ({ page, api, pool }) => {
  // The fixture's pool gives the card something to draw. The button renders either way, but an
  // empty card is a different page, so the tile is waited for before the click.
  const shownPool = await readShownPool(api, pool);
  await openDashboardWithReportCards(page, api);
  await expect(page.locator(dashboardLocators.storage.poolName(shownPool.name))).toBeVisible({
    timeout: widgetLoadTimeoutMs,
  });

  await clickReportButton(page, dashboardLocators.storage.reports);

  await expect(page).toHaveURL(/\/reportsdashboard\/disk$/);
  await expect(page.locator(reportingLocators.devices)).toBeVisible({ timeout: reportLoadTimeoutMs });
});

test('the Interface card\'s report button opens the Network tab on the card\'s NIC', async ({ page, api }) => {
  // The tab renders only its first few reports, sorted by NIC, so the card is set to the NIC whose
  // report comes first among those the card can show, rather than to the first NIC webui lists.
  const nic = await findFirstGraphIdentifier(api, 'interface', await readDashboardNicNames(api));
  if (!nic) {
    throw new Error('reporting.netdata_graphs collects interface traffic for no NIC the Interface card can show.');
  }
  const title = await findGraphTitleFor(api, 'interface', nic);
  if (!title) {
    throw new Error(`reporting.netdata_graphs has no interface graph for ${nic}.`);
  }
  await openDashboardWithReportCards(page, api, nic);

  await clickReportButton(page, dashboardLocators.reportButtons.network);

  await expect(page).toHaveURL(/\/reportsdashboard\/network$/);
  await expect(page.locator(reportingLocators.title(title))).toBeVisible({ timeout: reportLoadTimeoutMs });
});

test('the System Information card\'s report button opens the System tab', async ({ page, api }) => {
  const title = requireGraphTitle(await findGraphTitle(api, 'uptime'), 'uptime');
  await openDashboardWithReportCards(page, api);

  await clickReportButton(page, dashboardLocators.reportButtons.systemInfo);

  await expect(page).toHaveURL(/\/reportsdashboard\/system$/);
  await expect(page.locator(reportingLocators.title(title))).toBeVisible({ timeout: reportLoadTimeoutMs });
});
