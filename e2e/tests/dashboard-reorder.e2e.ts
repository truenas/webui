/**
 * Story: an admin rearranges the Dashboard in Configure mode. A card group dragged to a new place on
 * a desktop, or moved with the Move buttons at phone width, stays there once saved, and Reset puts
 * the default cards back.
 *
 * The layout is the admin's own `dashState` attribute. Each test writes the layout it starts from
 * over the API, and `afterEach` writes back the one the account had, because
 * `tests/dashboard.e2e.ts` runs on whatever layout it finds and relies on it holding System
 * Information. See `fixtures/dashboard.ts`.
 *
 * `DashboardStore` reads the layout from the account the app loaded at sign-in, and the `page`
 * fixture signs in before a test writes anything. So each test reloads after reaching the
 * Dashboard, which makes the app read `auth.me` again.
 */
import type { Page } from '@playwright/test';
import {
  captureDashState, nonHaDefaultDashState, readDashState, restoreDashState, writeDashState,
} from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import { isHaLicensed } from '../fixtures/ha';
import {
  dragCardGroup, enterConfigureMode, moveCardGroupDown, resetDashboard, saveDashboard,
} from '../flows/dashboard';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/** Each widget waits on its own API call before it renders. */
const widgetLoadTimeoutMs = 30_000;

/** System Information, then Help, then CPU Model, one full-width group each. */
const threeGroups: DashboardGroup[] = [
  { layout: 'full', slots: [{ type: 'system-info-active' }] },
  { layout: 'full', slots: [{ type: 'help' }] },
  { layout: 'full', slots: [{ type: 'cpu-model-widget' }] },
];

/** Where CPU Model sits in {@link threeGroups}. */
const cpuModelGroupIndex = 2;

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

/** The first widget type of every group in the saved layout, in order. */
async function readGroupTypes(api: E2eApiClient): Promise<string[]> {
  const saved = await readDashState(api) as DashboardGroup[];

  return saved.map((group) => group.slots[0]?.type ?? '');
}

/** How far down the page an element starts. */
async function topOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).boundingBox();
  if (!box) {
    throw new Error(`${selector} has no bounding box.`);
  }

  return box.y;
}

/** CPU Model sits above System Information on screen. */
async function expectCpuModelAboveSystemInfo(page: Page): Promise<void> {
  await expect(page.locator(dashboardLocators.cpuModel.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.systemInfo.hostname)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  expect(await topOf(page, dashboardLocators.cpuModel.title))
    .toBeLessThan(await topOf(page, dashboardLocators.systemInfo.hostname));
}

test.describe('on a desktop', () => {
  // Narrower than two 540 px groups side by side, so the groups stack in one column and "above"
  // means earlier in the layout. Tall enough that the first and third groups' handles are both on
  // screen for the drag.
  test.use({ viewport: { width: 1000, height: 1600 } });

  test('an admin drags a card group to the top, saves, and it is still there after a reload', async ({
    page, api,
  }) => {
    await writeDashState(api, threeGroups);

    await goToDashboard(page);
    await page.reload();
    await expect(page.locator(dashboardLocators.cpuModel.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });

    await enterConfigureMode(page);
    await dragCardGroup(page, cpuModelGroupIndex, 0);
    await saveDashboard(page);

    await expectCpuModelAboveSystemInfo(page);
    expect(await readGroupTypes(api)).toEqual(['cpu-model-widget', 'system-info-active', 'help']);

    await page.reload();
    await expectCpuModelAboveSystemInfo(page);
  });
});

test.describe('at phone width', () => {
  // Below the 600 px breakpoint, where Move up and Move down are shown.
  test.use({ viewport: { width: 400, height: 900 } });

  test('an admin moves a card group down with its Move down button and saves', async ({ page, api }) => {
    await writeDashState(api, threeGroups);

    // At this width the sidebar is folded away. Sign-in lands on the Dashboard, which is how a
    // phone user arrives there, so there is nothing to click through.
    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await page.reload();
    await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });

    await enterConfigureMode(page);
    await moveCardGroupDown(page, 0);
    await saveDashboard(page);

    expect(await readGroupTypes(api)).toEqual(['help', 'system-info-active', 'cpu-model-widget']);
  });
});

test('Reset in Configure mode restores the default cards, and Save keeps them', async ({ page, api }) => {
  // The HA default has a System Information group for the standby controller as well, which
  // `nonHaDefaultDashState` leaves out.
  test.skip(await isHaLicensed(api), 'The expected default is the one for an appliance without an HA license.');

  await writeDashState(api, [{ layout: 'full', slots: [{ type: 'help' }] }]);

  await goToDashboard(page);
  await page.reload();
  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.cpuUsageGauge.title)).toHaveCount(0);

  await enterConfigureMode(page);
  await expect(page.locator(dashboardLocators.edit.reset)).toBeVisible();
  await resetDashboard(page);
  await saveDashboard(page);

  await expect(page.locator(dashboardLocators.cpuUsageGauge.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  expect(await readDashState(api)).toEqual(nonHaDefaultDashState);

  // Reset is offered only while the layout differs from the default, which it no longer does.
  await enterConfigureMode(page);
  await expect(page.locator(dashboardLocators.edit.reset)).toBeHidden();
});
