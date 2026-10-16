/**
 * Story: an admin exports a pool from its Disconnect dialog, and chooses whether
 * the configuration that depends on it goes too.
 *
 * Export is the non-destructive disconnect: the data stays on the disks, so the
 * pool can be imported again. "Delete saved configurations from TrueNAS?"
 * (`cascade`) is what decides whether the shares and tasks on the pool survive,
 * and getting it backwards either deletes a user's shares silently or leaves
 * them pointing at nothing. So each test sets it one way and asks
 * `sharing.smb.query` what became of a share on the pool.
 *
 * The form starts with `cascade` **ticked**. Keeping the configuration is the
 * choice a user has to make, not the default.
 *
 * The rest is settled through the API too: `pool.query` must no longer list the
 * pool, and `disk.details` must report its disk carrying it exported, which is
 * what tells an export from a destroy. Delete Pool is
 * `tests/pool-disconnect.e2e.ts`; importing a pool exported over the API is
 * `tests/pool-import.e2e.ts`.
 *
 * ## Why this spec builds its own pool
 *
 * Exporting the worker-scoped `pool` fixture would take it from under every
 * later spec. `e2e_export_tank` is this spec's own. A disk left carrying it
 * exported is one the pool wizard will not offer, and `fresh-install` needs
 * those, so it is removed before and after each test whatever state it was
 * left in: destroyed if imported, its disk wiped if exported.
 *
 * The SMB service is never started. The share only has to exist as
 * configuration for the dialog to list it and for `cascade` to act on it.
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
