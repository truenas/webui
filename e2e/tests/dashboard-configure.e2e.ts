/**
 * Story: an admin edits the Dashboard in Configure mode. A card group they add or delete is still
 * there, or still gone, after a reload, and Cancel throws an unsaved edit away.
 *
 * The layout is the admin's own `dashState` attribute. Each test writes the layout it starts from
 * over the API, and `afterEach` writes back the one the account had, because
 * `tests/dashboard.e2e.ts` runs on whatever layout it finds and relies on it holding System
 * Information. See `fixtures/dashboard.ts`.
 *
 * `DashboardStore` reads the layout from the account the app loaded at sign-in, and the `page`
 * fixture signs in before a test writes anything. So each test reloads after opening the
 * Dashboard, which makes the app read `auth.me` again.
 *
 * Does not need a pool, so it does not ask for the `pool` fixture: the layouts it writes and the card
 * it adds are System Information, Help, CPU Model and CPU Overview, none of which shows storage.
 */
import { captureDashState, readDashState, restoreDashState, writeDashState } from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import {
  addCardGroup, cancelConfigure, deleteCardGroup, enterConfigureMode, saveDashboard,
} from '../flows/dashboard';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { expect, test } from '../support/fixtures';

/** Each widget waits on its own API call before it renders. */
const widgetLoadTimeoutMs = 30_000;

/** System Information, then Help, then CPU Model, one full-width group each. */
const threeGroups: DashboardGroup[] = [
  { layout: 'full', slots: [{ type: 'system-info-active' }] },
  { layout: 'full', slots: [{ type: 'help' }] },
  { layout: 'full', slots: [{ type: 'cpu-model-widget' }] },
];

/** Where Help sits in {@link threeGroups}. */
const helpGroupIndex = 1;

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

test('an admin adds the CPU Overview card in Configure mode, saves, and it is still there after a reload', async ({
  page, api,
}) => {
  const layout: DashboardGroup[] = [
    { layout: 'full', slots: [{ type: 'system-info-active' }] },
    { layout: 'full', slots: [{ type: 'help' }] },
  ];
  await writeDashState(api, layout);

  await goToDashboard(page);
  await page.reload();
  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.cpu.title)).toHaveCount(0);

  await enterConfigureMode(page);
  await addCardGroup(page, {
    layoutToggle: dashboardLocators.cardEditor.fullLayout,
    category: dashboardLocators.cardEditor.categoryCpu,
    type: dashboardLocators.cardEditor.typeCpuOverview,
  });
  await expect(page.locator(dashboardLocators.cpu.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await saveDashboard(page);

  const saved = await readDashState(api) as DashboardGroup[];
  expect(saved).toHaveLength(3);
  // The editor may add `settings` to the slot, so only the layout and the type are pinned.
  expect(saved[2]).toMatchObject({ layout: 'full', slots: [{ type: 'cpu' }] });

  await page.reload();
  await expect(page.locator(dashboardLocators.cpu.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });
});

test('an admin deletes a card group in Configure mode, saves, and it is still gone after a reload', async ({
  page, api,
}) => {
  await writeDashState(api, threeGroups);

  await goToDashboard(page);
  await page.reload();
  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });

  await enterConfigureMode(page);
  await deleteCardGroup(page, helpGroupIndex);
  await expect(page.locator(dashboardLocators.help.documentation)).toBeHidden();
  await saveDashboard(page);

  const saved = await readDashState(api) as DashboardGroup[];
  expect(saved).toHaveLength(2);
  expect(saved.flatMap((group) => group.slots.map((slot) => slot.type))).not.toContain('help');

  await page.reload();
  // The CPU Model card first, so the Help check runs on a loaded layout rather than an empty page.
  await expect(page.locator(dashboardLocators.cpuModel.title)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  await expect(page.locator(dashboardLocators.help.documentation)).toBeHidden();
});

test('Cancel in Configure mode puts back a deleted card group and saves nothing', async ({ page, api }) => {
  await writeDashState(api, threeGroups);

  await goToDashboard(page);
  await page.reload();
  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });

  await enterConfigureMode(page);
  await deleteCardGroup(page, helpGroupIndex);
  await expect(page.locator(dashboardLocators.help.documentation)).toBeHidden();
  await cancelConfigure(page);

  await expect(page.locator(dashboardLocators.help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  expect(await readDashState(api)).toEqual(threeGroups);
});
