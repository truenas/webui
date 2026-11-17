/**
 * Story: an admin exports a pool from its Disconnect dialog and chooses whether dependent configuration goes too.
 * `cascade` starts ticked; each test sets it one way and asks `sharing.smb.query` what became of a share on the
 * pool. `disk.details` reporting the disk as carrying an exported pool tells an export from a destroy.
 * `e2e_export_tank` is this spec's own; a disk left carrying it exported is one the wizard won't offer and
 * `fresh-install` needs, so it's removed before and after each test: destroyed if imported, disk wiped if exported.
 * The SMB service is never started; the share only has to exist as configuration.
 */
import { ensureExportedPoolGone, findDisksCarryingExportedPool } from '../fixtures/disks';
import { ensurePoolPresent } from '../fixtures/pool';
import { ensureSmbShareAbsent, ensureSmbSharePresent, findSmbShare } from '../fixtures/smb';
import { datasetMountPath, ensureSmbDatasetPresent, findPool } from '../fixtures/storage';
import { exportPoolFromDialog, importPool, openPoolDisconnectDialog } from '../flows/storage';
import { poolCardLocators, poolDisconnectLocators } from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Built and exported here. Not a name any other spec looks for. */
const pool = 'e2e_export_tank';
const dataset = `${pool}/share`;
const share = 'e2e-export-share';
const sharePath = datasetMountPath(dataset);

/** `pool.attachments` reports an SMB share under its delegate's title. */
const smbAttachmentType = 'SMB Share';

/** The dashboard reloads every pool and its disks after an export or import. */
const dashboardReloadTimeoutMs = 60_000;

async function cleanUp(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    [`remove share "${share}"`, () => ensureSmbShareAbsent(api, share)],
    [`remove pool "${pool}" and wipe any disk still carrying it`, () => ensureExportedPoolGone(api, pool)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await cleanUp(api);

  await ensurePoolPresent(api, pool);
  await ensureSmbDatasetPresent(api, dataset);
  await ensureSmbSharePresent(api, { name: share, path: sharePath });
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`pool "${pool}", share "${share}" and any disk still carrying the pool`)) {
    return;
  }

  await cleanUp(api);
});

test('an export that keeps the configuration leaves the share in place through an import', async ({ page, api }) => {
  await openPoolDisconnectDialog(page, pool);

  // The dialog lists what depends on the pool before it acts. The list sits in
  // a collapsed panel with no toggle id, but it is rendered, and `toHaveText`
  // reads it without needing it on screen.
  await expect(page.locator(poolDisconnectLocators.attachment(smbAttachmentType, share))).toHaveText(share);

  await exportPoolFromDialog(page, { deleteConfiguration: false });

  await expect(page.locator(poolCardLocators.name(pool))).toBeHidden({ timeout: dashboardReloadTimeoutMs });
  expect(await findPool(api, pool)).toBeUndefined();
  expect(await findDisksCarryingExportedPool(api, pool)).toHaveLength(1);
  expect((await findSmbShare(api, share))?.path).toBe(sharePath);

  await importPool(page, pool);

  await expect(page.locator(poolCardLocators.name(pool))).toHaveText(pool, { timeout: dashboardReloadTimeoutMs });
  expect((await findPool(api, pool))?.status).toBe('ONLINE');
  expect((await findSmbShare(api, share))?.path).toBe(sharePath);
});

test('an export that deletes the saved configuration takes the share on the pool with it', async ({ page, api }) => {
  // The starting state the export has to change.
  expect((await findSmbShare(api, share))?.path).toBe(sharePath);

  await openPoolDisconnectDialog(page, pool);
  await exportPoolFromDialog(page, { deleteConfiguration: true });

  await expect(page.locator(poolCardLocators.name(pool))).toBeHidden({ timeout: dashboardReloadTimeoutMs });
  expect(await findPool(api, pool)).toBeUndefined();
  // Still on the disk, exported: the configuration went, the data did not.
  expect(await findDisksCarryingExportedPool(api, pool)).toHaveLength(1);
  expect(await findSmbShare(api, share)).toBeUndefined();
});
