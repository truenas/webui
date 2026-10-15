/**
 * Stories: the NFS Sessions page, opened from "NFS Sessions" on the NFS list.
 *
 * The page lists the clients the running server has, one version at a time,
 * behind an NFS 3 / NFS 4 switch. Nothing in this suite can mount a share, so
 * what is checked is the page with no client: each version shows its own empty
 * state, the switch moves between them, and Refresh asks again and is answered.
 *
 * Refresh is checked on the call it sends, not only on the page it leaves. With
 * no client the answer never changes, so a Refresh that did nothing would leave
 * the same empty state behind; the page's own websocket is the only place the
 * difference shows. Hence `recordApiCalls`.
 *
 * The service runs for these tests, because the page asks the running server,
 * and it is stopped again in teardown.
 */
import { ensureNfsServiceRunning, ensureNfsServiceStopped } from '../fixtures/nfs';
import { openNfsListPage, openNfsSessionsPage } from '../flows/nfs';
import { formSettleTimeoutMs } from '../flows/smb';
import { nfsLocators } from '../locators/nfs';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What the NFS 4 view asks middleware for, each time it loads. */
const nfs4ClientsMethod = 'nfs.get_nfs4_clients';

test.use({ recordApiCalls: true });

test.beforeEach(async ({ api }) => {
  await ensureNfsServiceRunning(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the NFS service running')) {
    return;
  }

  // Service state is global: left running, it changes which dialog the share
  // form raises for every later spec.
  await runCleanupSteps([
    ['stop the NFS service', () => ensureNfsServiceStopped(api)],
  ]);
});

test('NFS Sessions shows each version empty with no client mounted, and Refresh asks again', async ({ page }) => {
  const { sessions } = nfsLocators;

  await openNfsListPage(page);
  await openNfsSessionsPage(page);
  await expect(page).toHaveURL(/\/sharing\/nfs\/sessions$/);

  // The page opens on NFS 3, and only that version's empty state is on it.
  await expect(page.locator(sessions.nfs3Empty)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(sessions.nfs4Empty)).toBeHidden();

  await page.locator(sessions.nfs4).click();
  await expect(page.locator(sessions.nfs4)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(sessions.nfs4Empty)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(sessions.nfs3Empty)).toBeHidden();

  // Refresh on NFS 4: a new call for that version, answered with a result. The
  // empty state is only rendered once a query has answered, so the calls before
  // this point are all settled and the slice holds Refresh's alone.
  const before = apiCallsTo(page, nfs4ClientsMethod).length;
  await page.locator(sessions.refresh).click();

  const refreshAnswers = (): (string | undefined)[] => (
    apiCallsTo(page, nfs4ClientsMethod).slice(before).map((call) => call.answer)
  );
  await expect.poll(refreshAnswers, { timeout: formSettleTimeoutMs }).toContain('result');
  expect(refreshAnswers()).not.toContain('error');
  // A failed query would have replaced the empty state with the table's error.
  await expect(page.locator(sessions.nfs4Empty)).toBeVisible();

  // And back: the switch goes both ways.
  await page.locator(sessions.nfs3).click();
  await expect(page.locator(sessions.nfs3)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(sessions.nfs3Empty)).toBeVisible({ timeout: formSettleTimeoutMs });
  await expect(page.locator(sessions.nfs4Empty)).toBeHidden();
});
