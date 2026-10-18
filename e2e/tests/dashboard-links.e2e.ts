/**
 * Story: an admin on the Dashboard finds the TrueNAS Help card's links pointing where they should,
 * copies the version from System Information, and opens the Update page from its update button.
 *
 * The Help links lead off the appliance, so each one's `href` and `target` are asserted and none is
 * followed. Following one would test the site at the other end, not the UI.
 *
 * Each test writes a layout of System Information and TrueNAS Help and `afterEach` writes back the
 * admin's own, as `dashboard-widgets.e2e.ts` does and for the same reason: `tests/dashboard.e2e.ts`
 * runs on whatever layout it finds. See `fixtures/dashboard.ts`. The layout holds one System
 * Information card and no other copy button, so the version's copy button is the only one on the
 * page. Nothing is created on the appliance.
 *
 * The update check's own answer is not asserted: whether an update is offered depends on the update
 * server, not on the UI.
 *
 * Does not need a pool, so it does not ask for the `pool` fixture: neither card shows storage, and
 * the Update page's Install button renders whether or not the appliance has a pool.
 */
import { captureDashState, restoreDashState, writeDashState } from '../fixtures/dashboard';
import type { CapturedDashState, DashboardGroup } from '../fixtures/dashboard';
import { readIsCommercialOrEnterprise, readSystemIdentity } from '../fixtures/system-info';
import { goToDashboard } from '../flows/navigation';
import { dashboardLocators } from '../locators/dashboard';
import { updateLocators } from '../locators/update';
import { expect, test } from '../support/fixtures';

/** Each widget waits on its own API call before it renders. */
const widgetLoadTimeoutMs = 30_000;

/** The Update page loads its config and runs the update check before it settles. */
const updatePageTimeoutMs = 60_000;

/** Put on the clipboard before the copy, so a click that copies nothing cannot pass. */
const clipboardPlaceholder = 'e2e-clipboard-placeholder';

const layout: DashboardGroup[] = [
  { layout: 'full', slots: [{ type: 'system-info-active' }] },
  { layout: 'full', slots: [{ type: 'help' }] },
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
  // `DashboardStore` read the layout at sign-in, before it was written here.
  await page.reload();
});

test.afterEach(async ({ api }) => {
  // Guarded: Playwright runs this even when `beforeEach` threw, and there is then nothing to
  // restore. Writing `undefined` would be serialized as `null` over the admin's layout.
  if (captured) {
    await restoreDashState(api, captured);
  }
});

test('the TrueNAS Help card links to the docs, the forums, the newsletter and the edition\'s page', async ({
  page, api,
}) => {
  const { help } = dashboardLocators;
  const isCommercialOrEnterprise = await readIsCommercialOrEnterprise(api);
  // `CopyrightLineComponent.targetHref`.
  const copyrightHref = isCommercialOrEnterprise ? 'https://truenas.com/production' : 'https://truenas.com/testdrive';
  const links: [string, string][] = [
    [help.documentation, 'https://www.truenas.com/docs/'],
    [help.forums, 'https://forums.truenas.com/'],
    [help.newsletter, 'https://www.truenas.com/newsletter/'],
    [help.copyright, copyrightHref],
  ];

  await expect(page.locator(help.documentation)).toBeVisible({ timeout: widgetLoadTimeoutMs });
  for (const [locator, href] of links) {
    const link = page.locator(locator);
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
  }
});

test('copying the version puts exactly the version system.info reports on the clipboard', async ({ page, api }) => {
  const { version } = await readSystemIdentity(api);
  const copyButton = page.locator(dashboardLocators.systemInfo.copyVersion);
  await expect(copyButton).toBeVisible({ timeout: widgetLoadTimeoutMs });

  // Per browser context, which can outlive this test; the `page` fixture revokes it afterwards.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  });
  await page.evaluate((text) => navigator.clipboard.writeText(text), clipboardPlaceholder);

  await copyButton.click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(version);
});

test('the System Information card\'s update button opens the Update page', async ({ page }) => {
  const updateButton = page.locator(dashboardLocators.systemInfo.update);
  await expect(updateButton).toBeVisible({ timeout: widgetLoadTimeoutMs });

  await updateButton.click();

  await expect(page).toHaveURL(/\/system\/update$/);
  await expect(page.locator(updateLocators.installManualUpdate)).toBeVisible({ timeout: updatePageTimeoutMs });
});
