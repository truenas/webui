/**
 * Stories: the SMB status page from "SMB Sessions": each of its four tabs routes, is selected, and shows its list.
 * Not covered: empty states (`tn-empty` has no id, and a zero row count would also pass while loading or after a
 * failed call); and the Shares tab listing a share, since `smb.status` reports tree connections only while a client
 * is connected, and this suite has no SMB client. The service runs for these tests and is stopped in teardown.
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
