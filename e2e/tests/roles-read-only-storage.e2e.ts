/**
 * Story: a read-only administrator browses a dataset, its snapshots and the
 * storage dashboard, and finds every control that would change them locked or
 * absent, while the dataset and its snapshot stay as they were.
 *
 * Two styles of gate, and they are asserted differently. Most controls sit in
 * `*ixRequiresRoles`, which renders them disabled inside the role-missing
 * wrapper. Edit and Delete on the Dataset Details card are not rendered at all
 * without `DATASET_WRITE` / `DATASET_DELETE`.
 *
 * One sign-in for the whole story, as steps: every sign-in spends from the
 * unauthenticated rate limit. Nothing locked is ever clicked. The dataset, the
 * snapshot, its hold and the pool's last scan are read back over the API as a
 * guard that nothing got through.
 */
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import {
  ensureSnapshotPresent, ensureSnapshotsAbsent, findSnapshot, isSnapshotHeld,
} from '../fixtures/snapshots';
import {
  ensureDatasetAbsent, ensureDatasetPresent, findDataset, findPoolScan,
} from '../fixtures/storage';
import { goToDatasets, goToStorage } from '../flows/navigation';
import { expectHiddenByRole, expectLockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { expandSnapshot, openSnapshotList } from '../flows/snapshots';
import { permissionsLocators } from '../locators/permissions';
import { snapshotLocators } from '../locators/snapshots';
import {
  datasetDetailsLocators,
  datasetLocators,
  deleteDatasetDialogLocators,
  poolScrubLocators,
  zvolLocators,
} from '../locators/storage';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

const datasetName = 'e2e_roles_ds';
const snapshotName = 'e2e-roles-snap';

/** The datasets tree and the dashboard each load on their own API calls, after the shell. */
const pageSettleTimeoutMs = 60_000;

/**
 * What a scrub would change if one had started: the kind of the last scan, or
 * its start time if the last one was a scrub already.
 */
interface LastScan {
  function: string | null | undefined;
  startTime: number | undefined;
}

async function readLastScan(api: E2eApiClient, pool: string): Promise<LastScan> {
  const scan = await findPoolScan(api, pool);
  return { function: scan?.function, startTime: scan?.start_time?.$date };
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetName}`;

    await ensureRoleAdminAbsent(api, account);
    await ensureSnapshotsAbsent(api, dataset);
    await ensureDatasetAbsent(api, dataset);

    await ensureDatasetPresent(api, dataset);
    await ensureSnapshotPresent(api, dataset, snapshotName);
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api, pool }) => {
    const dataset = `${pool}/${datasetName}`;
    if (leavingTestData(`user "${account.username}", dataset "${dataset}" and its snapshots`)) {
      return;
    }

    await runCleanupSteps([
      [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
      ['remove the snapshots', () => ensureSnapshotsAbsent(api, dataset)],
      [`remove dataset ${datasetName}`, () => ensureDatasetAbsent(api, dataset)],
    ]);
  });

  test('datasets, snapshots and the pool can be seen and not changed', async ({ page, api, pool }) => {
    const dataset = `${pool}/${datasetName}`;
    const scanBefore = await readLastScan(api, pool);

    await signInAsRoleAdmin(page, account);

    await test.step('the dataset is shown, and adding, editing and deleting are not offered', async () => {
      await goToDatasets(page);
      const node = page.locator(datasetLocators.treeNode(dataset));
      await expect(node).toBeVisible({ timeout: pageSettleTimeoutMs });
      await node.click();
      await expect(page.locator(datasetDetailsLocators.path)).toContainText(dataset);

      await expectLockedByRole(page, datasetLocators.addDataset);
      await expectLockedByRole(page, zvolLocators.add);
      await expectLockedByRole(page, permissionsLocators.card.edit);
      await expectLockedByRole(page, snapshotLocators.card.takeSnapshot);

      // After the locks, which only render once the session's roles are known.
      // Edit and Delete start hidden until then, so checking them first could
      // pass on a card that had not yet asked.
      await expectHiddenByRole(page, datasetDetailsLocators.path, datasetLocators.editDataset);
      await expectHiddenByRole(page, datasetDetailsLocators.path, deleteDatasetDialogLocators.open);

      expect(await findDataset(api, dataset)).toBeDefined();
    });

    await test.step('the snapshot is listed, and nothing on it or the list can be acted on', async () => {
      await openSnapshotList(page, dataset);
      await expect(page.locator(snapshotLocators.list.row(dataset, snapshotName))).toBeVisible();
      await expandSnapshot(page, dataset, snapshotName);

      // The row's selection box is left alone: Delete Selected only renders once
      // something is picked, and picking is not role-gated.
      await expectLockedByRole(page, snapshotLocators.list.add);
      await expectLockedByRole(page, snapshotLocators.details.hold);
      await expectLockedByRole(page, snapshotLocators.details.clone(snapshotName));
      await expectLockedByRole(page, snapshotLocators.details.rollback(snapshotName));
      await expectLockedByRole(page, snapshotLocators.details.delete(snapshotName));

      expect(await findSnapshot(api, dataset, snapshotName)).toBeDefined();
      expect(await isSnapshotHeld(api, dataset, snapshotName)).toBe(false);
    });

    await test.step('Scrub Now is locked on the pool\'s Storage Health card', async () => {
      await goToStorage(page);
      await expect(page.locator(poolScrubLocators.start(pool))).toBeVisible({ timeout: pageSettleTimeoutMs });
      await expectLockedByRole(page, poolScrubLocators.start(pool));

      expect(await readLastScan(api, pool)).toEqual(scanBefore);
    });
  });
});
