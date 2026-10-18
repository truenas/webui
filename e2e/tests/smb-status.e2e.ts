/**
 * Stories: the SMB status page, opened from "SMB Sessions" on the SMB list.
 *
 * The page has four tabs (Sessions, Locks, Shares and Notifications), each a
 * list of what `smb.status` reports. What is checked is that each tab can be
 * reached: it routes, it is the selected tab, and its list is on the page.
 *
 * Not covered:
 * - Each tab's empty state. `tn-table` renders it as a `tn-empty` with no id,
 *   so no selector reaches it. A count of rows is no substitute: with no client
 *   connected the appliance has no rows to give, so a count of zero would pass
 *   while the list was still loading, or if its call had failed.
 * - The Shares tab listing a share. `smb.status` at the `SHARES` level reports
 *   tree connections, which exist only while a client is connected to a share.
 *   Publishing a share with the service running is not enough, and nothing in
 *   this suite can connect as an SMB client.
 *
 * The service runs for these tests, because the page reports on the running
 * server, and it is stopped again in teardown.
 */
import { ensureSmbServiceRunning, ensureSmbServiceStopped } from '../fixtures/smb';
import { openSmbListPage, openSmbStatusTab } from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The four tabs, by the slug each one routes to. */
const tabSlugs = ['sessions', 'locks', 'shares', 'notifications'];

/**
 * The `pool` fixture is asked for, though nothing here is stored under it: the
 * Shares dashboard renders an empty state instead of its cards on an appliance
 * with no pool, and the SMB card is where the list is opened from. Asking is the
 * whole precondition; the name goes into the report so a failure says which pool
 * the dashboard was showing.
 */
test.beforeEach(async ({ api, pool }) => {
  test.info().annotations.push({ type: 'pool', description: pool });
  await ensureSmbServiceRunning(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the SMB service running')) {
    return;
  }

  // Service state is global: left running, it changes which dialog the share
  // form raises for every later spec.
  await runCleanupSteps([
    ['stop the SMB service', () => ensureSmbServiceStopped(api)],
  ]);
});

test('SMB Sessions opens the status page, and each of its four tabs can be reached', async ({ page }) => {
  await openSmbListPage(page);
  await page.locator(smbLocators.list.sessionsLink).click();

  // The link lands on Sessions, so that tab is selected before any is clicked.
  await expect(page).toHaveURL(/\/sharing\/smb\/status\/sessions$/);
  await expect(page.locator(smbLocators.status.tab('sessions'))).toHaveAttribute('aria-selected', 'true');

  for (const slug of tabSlugs) {
    await openSmbStatusTab(page, slug);

    // The tab routes, so the URL says which list is mounted. All four tables
    // share one id, so the table alone could not.
    await expect(page).toHaveURL(new RegExp(`/sharing/smb/status/${slug}$`));
  }
});
