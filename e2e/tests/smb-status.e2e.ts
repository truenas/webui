/**
 * Stories: the SMB status page, opened from "SMB Sessions" on the SMB list.
 *
 * The page has four tabs (Sessions, Locks, Shares and Notifications), each a
 * list of what `smb.status` reports. The CI appliance has no SMB client, so
 * every list is empty, and that is what is checked: each tab can be reached
 * and shows an empty list.
 *
 * Not covered: the Shares tab listing a share. `smb.status` at the `SHARES`
 * level reports tree connections, which exist only while a client is
 * connected to a share. Publishing a share with the service running is not
 * enough, and nothing in this suite can connect as an SMB client.
 *
 * The service runs for these tests, because the page reports on the running
 * server, and it is stopped again in teardown.
 */
import {
  countSmbStatusEntries, ensureSmbServiceRunning, ensureSmbServiceStopped, type SmbStatusLevel,
} from '../fixtures/smb';
import { openSmbListPage, openSmbStatusTab } from '../flows/smb';
import { smbLocators } from '../locators/smb';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Each tab: its slug, the `smb.status` level its list reads, and the prefix of its row tags. */
const tabs: { slug: string; level: SmbStatusLevel; rowTagPrefix: string }[] = [
  { slug: 'sessions', level: 'SESSIONS', rowTagPrefix: 'smb-session-' },
  { slug: 'locks', level: 'LOCKS', rowTagPrefix: 'smb-lock-' },
  { slug: 'shares', level: 'SHARES', rowTagPrefix: 'smb-share-' },
  { slug: 'notifications', level: 'NOTIFICATIONS', rowTagPrefix: 'smb-notification-' },
];

test.beforeEach(async ({ api }) => {
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

test('SMB Sessions opens the status page, and each tab shows an empty list with no client connected', async ({
  page,
  api,
}) => {
  // The precondition the empty lists depend on. If a client were connected,
  // a row on some tab would be right and this test would be wrong.
  for (const { level } of tabs) {
    expect(await countSmbStatusEntries(api, level), `smb.status reports ${level} entries`).toBe(0);
  }

  await openSmbListPage(page);
  await page.locator(smbLocators.list.sessionsLink).click();

  // The link lands on Sessions, so that tab is selected before any is clicked.
  await expect(page).toHaveURL(/\/sharing\/smb\/status\/sessions$/);
  await expect(page.locator(smbLocators.status.tab('sessions'))).toHaveAttribute('aria-selected', 'true');

  for (const { slug, rowTagPrefix } of tabs) {
    await openSmbStatusTab(page, slug);

    // The tab routes, so the URL says which list is mounted. All four tables
    // share one id, so the table alone could not.
    await expect(page).toHaveURL(new RegExp(`/sharing/smb/status/${slug}$`));
    await expect(page.locator(smbLocators.status.rows(rowTagPrefix))).toHaveCount(0);
  }
});
