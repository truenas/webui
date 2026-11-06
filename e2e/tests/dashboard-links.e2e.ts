/**
 * Story: on the Dashboard an admin finds the TrueNAS Help links pointing where they should, copies the version from
 * System Information, and opens the Update page from its update button. Help links leave the appliance, so only
 * their `href` and `target` are asserted. Each test writes a layout of those two cards and `afterEach` restores the
 * admin's own (see `fixtures/dashboard.ts`), so the version's copy button is the only one on the page. Whether an
 * update is offered depends on the update server and is not asserted. No pool: neither card shows storage.
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

  // Per browser context, and every test gets its own, so there is nothing to revoke.
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
