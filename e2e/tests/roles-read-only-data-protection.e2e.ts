/**
 * Story: a read-only administrator sees a task on each of the Periodic Snapshot,
 * Replication, Rsync and Cloud Sync cards on Data Protection, and finds every
 * control that would change or run one locked: Add, the row's Enabled switch,
 * and Run, Dry Run, Restore and Delete in the row menu. On the snapshot card,
 * Edit opens its form and Save there is locked. Nothing is changed afterwards
 * and no task has run.
 *
 * One test with a step per card, so the account signs in once: every sign-in
 * spends from the unauthenticated rate limit (see `flows/roles.ts`).
 *
 * Every gated action is a `tn-menu-item` in the row's kebab menu, which the
 * role-missing wrapper never reaches, so `disabled` is all there is to check for
 * those. Edit carries no role on any card. The snapshot form is made dirty and
 * valid before Save is checked, so that Save can only be held down by the role.
 *
 * Every task is seeded over the API and none of them runs on its own: snapshot,
 * rsync and cloud sync tasks are scheduled monthly, and the replication task
 * only runs when asked. So a run found afterwards could only have been started
 * from the page.
 */
import type { Page } from '@playwright/test';
import {
  countCloudSyncTasks,
  ensureCloudSyncTasksAbsent,
  ensureCloudSyncTaskPresent,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncRunJobIds,
  findCloudSyncRuns,
  findCloudSyncTask,
} from '../fixtures/cloud-sync';
import {
  countReplicationTasks,
  ensureReplicationTaskAbsent,
  ensureReplicationTaskPresent,
  findReplicationRunJobIds,
  findReplicationRuns,
  findReplicationTask,
} from '../fixtures/replication-tasks';
import {
  ensureRoleAdminAbsent, ensureRoleAdminPresent, roleAdmins,
} from '../fixtures/role-admins';
import {
  ensureRsyncTasksAbsent,
  ensureRsyncTaskPresent,
  findRsyncRunJobIds,
  findRsyncRuns,
  findRsyncTask,
  rsyncRemoteHost,
} from '../fixtures/rsync-tasks';
import {
  ensureSnapshotTasksAbsent, ensureSnapshotTaskPresent, findSnapshotTask, type SnapshotTaskSchedule,
} from '../fixtures/snapshot-tasks';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { goToDataProtection } from '../flows/navigation';
import { expectLockedByRole, signInAsRoleAdmin } from '../flows/roles';
import { openEditSnapshotTaskForm } from '../flows/snapshot-tasks';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { confirmDialogLocators } from '../locators/dialogs';
import { replicationTaskLocators } from '../locators/replication-tasks';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import { servicesLocators } from '../locators/services';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const account = roleAdmins.readOnly;

/** The snapshot task's dataset, the replication task's source, and the rsync and cloud sync tasks' path. */
const taskLeaf = 'e2e_roles_dp';
/** The cloud sync task's remote folder, on the loopback SFTP remote. */
const remoteLeaf = 'e2e_roles_dp_remote';
/** The replication task's target. Never created: the task never runs. */
const replicaLeaf = 'e2e_roles_dp_dst';

const snapshotNamingSchema = 'e2e-roles-%Y-%m-%d_%H-%M';
const replicationName = 'e2e-roles-repl';
const rsyncModule = 'e2e-roles-dp';
const rsyncDescription = 'e2e roles rsync';
const cloudSyncDescription = 'e2e-roles-cloudsync';

/** The first of every month, so nothing fires between the test and its teardown. */
const monthly: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** The seeded task's id. Throws rather than falling back to an id no run could carry. */
function seededTaskId(task: { id: number } | undefined, kind: string): number {
  if (!task) {
    throw new Error(`the seeded ${kind} task is missing`);
  }
  return task.id;
}

/** Opens a row menu, checks each item is there and disabled, and closes the menu again. */
async function expectRowActionsLocked(page: Page, menu: string, items: string[]): Promise<void> {
  await page.locator(menu).click();
  for (const item of items) {
    await expect(page.locator(item)).toBeVisible();
    // A menu item is drawn by `tn-menu`, outside the role-missing wrapper, so
    // `disabled` is all there is to check (see `roleLocators.missing`).
    await expect(page.locator(item)).toBeDisabled();
  }
  await page.keyboard.press('Escape');
  await expect(page.locator(items[0])).toBeHidden();
}

/** Tasks before the credential and the datasets, so nothing is left pointing at either. */
function cleanupSteps(api: E2eApiClient, pool: string): [string, () => Promise<void>][] {
  const dataset = `${pool}/${taskLeaf}`;
  const path = datasetMountPath(dataset);

  return [
    [`remove user ${account.username}`, () => ensureRoleAdminAbsent(api, account)],
    [`remove cloud sync task "${cloudSyncDescription}"`, () => ensureCloudSyncTasksAbsent(api, cloudSyncDescription)],
    [`remove rsync tasks on ${path}`, () => ensureRsyncTasksAbsent(api, path)],
    [`remove replication task "${replicationName}"`, () => ensureReplicationTaskAbsent(api, replicationName)],
    [`remove snapshot tasks on ${dataset}`, () => ensureSnapshotTasksAbsent(api, dataset)],
    ['remove the loopback SFTP credential', () => ensureLoopbackSftpCredentialAbsent(api)],
    ...[replicaLeaf, remoteLeaf, taskLeaf].map((leaf): [string, () => Promise<void>] => [
      `remove dataset ${pool}/${leaf}`, () => ensureDatasetAbsent(api, `${pool}/${leaf}`),
    ]),
  ];
}

test.describe('as a read-only administrator', () => {
  test.use({ authenticate: false });

  test.beforeEach(async ({ api, pool }) => {
    const dataset = `${pool}/${taskLeaf}`;
    const path = datasetMountPath(dataset);

    for (const [, step] of cleanupSteps(api, pool)) {
      await step();
    }

    await ensureDatasetPresent(api, dataset);
    await ensureDatasetPresent(api, `${pool}/${remoteLeaf}`);
    await ensureSnapshotTaskPresent(api, { dataset, namingSchema: snapshotNamingSchema, schedule: monthly });
    await ensureReplicationTaskPresent(api, {
      name: replicationName, source: dataset, target: `${pool}/${replicaLeaf}`,
    });
    await ensureRsyncTaskPresent(api, {
      path,
      remoteModule: rsyncModule,
      description: rsyncDescription,
      schedule: monthly,
    });
    const credentialId = await ensureLoopbackSftpCredentialPresent(api);
    await ensureCloudSyncTaskPresent(api, {
      description: cloudSyncDescription,
      credentialId,
      path,
      remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
      schedule: monthly,
    });
    await ensureRoleAdminPresent(api, account);
  });

  test.afterEach(async ({ api, pool }) => {
    if (leavingTestData(`user "${account.username}", its data protection tasks, credential and datasets`)) {
      return;
    }

    await runCleanupSteps(cleanupSteps(api, pool));
  });

  test('the data protection cards lock every control that changes or runs a task', async ({ page, api, pool }) => {
    const dataset = `${pool}/${taskLeaf}`;
    const path = datasetMountPath(dataset);

    const replicationId = seededTaskId(await findReplicationTask(api, replicationName), 'replication');
    const rsyncId = seededTaskId(await findRsyncTask(api, path), 'rsync');
    const cloudSyncId = seededTaskId(await findCloudSyncTask(api, cloudSyncDescription), 'cloud sync');
    const replicationRunsBefore = await findReplicationRunJobIds(api);
    const rsyncRunsBefore = await findRsyncRunJobIds(api);
    const cloudSyncRunsBefore = await findCloudSyncRunJobIds(api);
    // Restore makes a new task rather than running one, so the counts are what would show it.
    const replicationCountBefore = await countReplicationTasks(api);
    const cloudSyncCountBefore = await countCloudSyncTasks(api);

    await signInAsRoleAdmin(page, account);
    await goToDataProtection(page);

    await test.step('the Periodic Snapshot Tasks card', async () => {
      const { card, form } = snapshotTaskLocators;
      await expect(page.locator(card.row(dataset))).toBeVisible();

      await expectLockedByRole(page, card.add);
      await expectLockedByRole(page, card.enabledToggle(dataset));
      await expectRowActionsLocked(page, card.rowMenu(dataset), [card.rowMenuDelete(dataset)]);

      await openEditSnapshotTaskForm(page, dataset, snapshotNamingSchema);
      await page.locator(form.namingSchema).fill('e2e-roles-edited-%Y-%m-%d_%H-%M');
      await expectLockedByRole(page, form.save);
      await page.locator(servicesLocators.closePanel).click();
      await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
      await page.locator(confirmDialogLocators.confirm).click();
      await expect(page.locator(form.namingSchema)).toBeHidden();

      expect(await findSnapshotTask(api, dataset)).toMatchObject({
        enabled: true,
        naming_schema: snapshotNamingSchema,
      });
    });

    await test.step('the Replication Tasks card', async () => {
      const { card } = replicationTaskLocators;
      await expect(page.locator(card.row(replicationName))).toBeVisible();

      await expectLockedByRole(page, card.add);
      await expectLockedByRole(page, card.enabledToggle(replicationName));
      await expectRowActionsLocked(page, card.rowMenu(replicationName), [
        card.rowMenuRun(replicationName),
        card.rowMenuRestore(replicationName),
        card.rowMenuDelete(replicationName),
      ]);

      expect(await findReplicationTask(api, replicationName)).toMatchObject({ enabled: true });
      expect(await findReplicationRuns(api, replicationId, replicationRunsBefore)).toEqual([]);
      expect(await countReplicationTasks(api)).toBe(replicationCountBefore);
    });

    await test.step('the Rsync Tasks card', async () => {
      const { card } = rsyncTaskLocators;
      await expect(page.locator(card.row(path, rsyncRemoteHost))).toBeVisible();

      await expectLockedByRole(page, card.add);
      await expectLockedByRole(page, card.enabledToggle(path, rsyncRemoteHost));
      await expectRowActionsLocked(page, card.rowMenu(path, rsyncRemoteHost), [
        card.rowMenuRun(path, rsyncRemoteHost),
        card.rowMenuDelete(path, rsyncRemoteHost),
      ]);

      expect(await findRsyncTask(api, path)).toMatchObject({ enabled: true });
      expect(await findRsyncRuns(api, rsyncId, rsyncRunsBefore)).toEqual([]);
    });

    await test.step('the Cloud Sync Tasks card', async () => {
      const { card } = cloudSyncLocators;
      await expect(page.locator(card.row(cloudSyncDescription))).toBeVisible();

      await expectLockedByRole(page, card.add);
      await expectLockedByRole(page, card.enabledToggle(cloudSyncDescription));
      await expectRowActionsLocked(page, card.rowMenu(cloudSyncDescription), [
        card.rowMenuRun(cloudSyncDescription),
        card.rowMenuDryRun(cloudSyncDescription),
        card.rowMenuRestore(cloudSyncDescription),
        card.rowMenuDelete(cloudSyncDescription),
      ]);

      expect(await findCloudSyncTask(api, cloudSyncDescription)).toMatchObject({ enabled: true });
      expect(await findCloudSyncRuns(api, cloudSyncId, cloudSyncRunsBefore)).toEqual([]);
      expect(await countCloudSyncTasks(api)).toBe(cloudSyncCountBefore);
    });
  });
});
