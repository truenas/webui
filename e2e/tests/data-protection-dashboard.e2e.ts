/**
 * Stories: an admin opens Data Protection and sees all five task cards at once —
 * each listing the tasks the appliance holds, or saying it holds none — follows
 * a card to its full list, and switches a task off and on again from its row.
 *
 * Each card's own add, edit and delete journeys are in that card's spec. This
 * one is about the page they share: that every card renders beside the others,
 * that each title leads to its own list and not a neighbour's, and that the
 * Enabled switch writes to the task in the row it sits on.
 *
 * TrueCloud Backup is the one card that never shows a row here. A task needs a
 * Storj account before middleware will store it (see `fixtures/cloud-backup.ts`),
 * so on this appliance its card is always the empty one.
 *
 * Every task is made over the API, on datasets made fresh for each test, and
 * none of them runs: snapshot, rsync and cloud sync tasks are scheduled monthly,
 * and the replication task only runs when asked.
 */
import { countCloudBackupTasks } from '../fixtures/cloud-backup';
import {
  countCloudSyncTasks,
  ensureCloudSyncTasksAbsent,
  ensureCloudSyncTaskPresent,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncTask,
  loopbackCredentialName,
} from '../fixtures/cloud-sync';
import {
  countReplicationTasks,
  ensureReplicationTaskAbsent,
  ensureReplicationTaskPresent,
  findReplicationTask,
} from '../fixtures/replication-tasks';
import {
  countRsyncTasks,
  ensureRsyncTasksAbsent,
  ensureRsyncTaskPresent,
  findRsyncTask,
  rsyncRemoteHost,
} from '../fixtures/rsync-tasks';
import {
  countSnapshotTasks,
  ensureSnapshotTasksAbsent,
  ensureSnapshotTaskPresent,
  findSnapshotTask,
  type SnapshotTaskSchedule,
} from '../fixtures/snapshot-tasks';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { type FullListLink, openFullListFromCard, toggleCardTaskEnabled } from '../flows/data-protection';
import { goToDataProtection } from '../flows/navigation';
import { cloudBackupLocators } from '../locators/cloud-backup';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { replicationTaskLocators } from '../locators/replication-tasks';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import { snapshotTaskLocators } from '../locators/snapshot-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** What every card's task points at: the snapshot task's dataset, and the rsync and cloud sync tasks' path. */
const taskLeaf = 'e2e_dpdash_task';

/** The cloud sync task's remote folder, on the loopback SFTP remote. */
const remoteLeaf = 'e2e_dpdash_remote';

/** Three more, so View All has a fifth snapshot task to be needed for. */
const extraLeaves = ['e2e_dpdash_extra_1', 'e2e_dpdash_extra_2', 'e2e_dpdash_extra_3'];

const leaves = [taskLeaf, remoteLeaf, ...extraLeaves];

/** The replication task's target. Never created: the task never runs. */
const replicaLeaf = 'e2e_dpdash_replica';

const snapshotNamingSchema = 'e2e-dpdash-%Y-%m-%d_%H-%M';
const replicationName = 'e2e-dpdash-replication';
const rsyncModule = 'e2e-dpdash';
const rsyncDescription = 'e2e dashboard rsync';
const cloudSyncDescription = 'e2e dashboard cloud sync';

/** The first of every month, so nothing fires between a test and its teardown. */
const monthly: SnapshotTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** How many tasks each card lists before its pager — `pageSize` on every one of them. */
const cardPageSize = 4;

/** A card whose title leads to its full list, named for the step it runs in. */
type FullListCase = FullListLink & { name: string };

/** A card row's Enabled switch, and what the appliance holds for the task behind it. */
interface RowToggleCase {
  name: string;
  toggle: string;
  enabled: () => Promise<boolean | undefined>;
}

/** What the cards show the seeded tasks by. */
interface SeededTasks {
  /** The snapshot task's dataset, and the replication task's source. */
  dataset: string;
  /** The rsync and cloud sync tasks' local path: that dataset's mount point. */
  path: string;
}

function seededTasks(pool: string): SeededTasks {
  const dataset = `${pool}/${taskLeaf}`;
  return { dataset, path: datasetMountPath(dataset) };
}

/** How many tasks of each kind the appliance holds, whoever made them, labelled for a failure message. */
async function countTasks(api: E2eApiClient): Promise<[string, number][]> {
  return [
    ['periodic snapshot', await countSnapshotTasks(api)],
    ['replication', await countReplicationTasks(api)],
    ['rsync', await countRsyncTasks(api)],
    ['cloud sync', await countCloudSyncTasks(api)],
  ];
}

/**
 * Fails up front when a card cannot show the row a test adds to it.
 *
 * Every card lists four tasks before its pager, and the pager leaves for the
 * full list rather than expanding. A fresh appliance holds none; failing here
 * says which card is full rather than timing out on a hidden row.
 */
async function requireRoomOnEveryCard(api: E2eApiClient): Promise<void> {
  for (const [kind, existing] of await countTasks(api)) {
    expect(existing + 1 <= cardPageSize, `the ${kind} card lists ${cardPageSize} tasks, the appliance has ${existing}`)
      .toBe(true);
  }
}

/** One task per card that can hold one, each over the API: the cards showing them is the thing under test. */
async function seedOneTaskPerCard(api: E2eApiClient, pool: string, credentialId: number): Promise<SeededTasks> {
  const seeded = seededTasks(pool);

  await ensureSnapshotTaskPresent(api, {
    dataset: seeded.dataset, namingSchema: snapshotNamingSchema, schedule: monthly,
  });
  await ensureReplicationTaskPresent(api, {
    name: replicationName, source: seeded.dataset, target: `${pool}/${replicaLeaf}`,
  });
  await ensureRsyncTaskPresent(api, {
    path: seeded.path,
    remoteModule: rsyncModule,
    description: rsyncDescription,
    schedule: monthly,
  });
  await ensureCloudSyncTaskPresent(api, {
    description: cloudSyncDescription,
    credentialId,
    path: seeded.path,
    remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
    schedule: monthly,
  });

  return seeded;
}

/**
 * Every task this spec can make, whichever test made it, as cleanup steps.
 * Tasks before datasets, so none is left pointing at a path that is gone.
 */
function removeTaskSteps(api: E2eApiClient, pool: string): [string, () => Promise<void>][] {
  const { path } = seededTasks(pool);

  return [
    [
      `remove the cloud sync tasks "${cloudSyncDescription}"`,
      () => ensureCloudSyncTasksAbsent(api, cloudSyncDescription),
    ],
    [`remove the rsync tasks on "${path}"`, () => ensureRsyncTasksAbsent(api, path)],
    [`remove the replication task "${replicationName}"`, () => ensureReplicationTaskAbsent(api, replicationName)],
    ...leaves.map((leaf): [string, () => Promise<void>] => [
      `remove the snapshot tasks on "${pool}/${leaf}"`, () => ensureSnapshotTasksAbsent(api, `${pool}/${leaf}`),
    ]),
  ];
}

let credentialId: number;

test.beforeAll(async ({ api }) => {
  await ensureCloudSyncTasksAbsent(api, cloudSyncDescription);
  credentialId = await ensureLoopbackSftpCredentialPresent(api);
});

/**
 * Tasks first, then datasets, and the datasets are then made again. Run before
 * each test as well as after, so an interrupted run leaves the next one able to
 * start.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const [, remove] of removeTaskSteps(api, pool)) {
    await remove();
  }
  for (const leaf of [replicaLeaf, ...leaves]) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
  }
  for (const leaf of leaves) {
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = [replicaLeaf, ...leaves].map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the data protection tasks on, and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...removeTaskSteps(api, pool),
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

test.afterAll(async ({ api }) => {
  if (leavingTestData(`the SFTP credential "${loopbackCredentialName}", its keypair and root's key`)) {
    return;
  }

  await runCleanupSteps([
    [
      `remove the cloud sync tasks "${cloudSyncDescription}"`,
      () => ensureCloudSyncTasksAbsent(api, cloudSyncDescription),
    ],
    ['remove the loopback SFTP credential', () => ensureLoopbackSftpCredentialAbsent(api)],
  ]);
});

test('every card on Data Protection says so when the appliance has no task of its kind', async ({ page, api }) => {
  const counts: [string, number][] = [
    ...await countTasks(api),
    ['TrueCloud Backup', await countCloudBackupTasks(api)],
  ];
  // This spec removes only its own tasks, so one made by someone else would keep a card from being empty.
  for (const [kind, existing] of counts) {
    expect(existing, `the empty ${kind} card needs an appliance with no ${kind} task, and it has ${existing}`)
      .toBe(0);
  }

  await goToDataProtection(page);

  for (const empty of [
    snapshotTaskLocators.card.empty,
    replicationTaskLocators.card.empty,
    rsyncTaskLocators.card.empty,
    cloudSyncLocators.card.empty,
    cloudBackupLocators.card.empty,
  ]) {
    await expect(page.locator(empty)).toBeVisible();
  }
});

test('every card on Data Protection lists the task the appliance has', async ({ page, api, pool }) => {
  await requireRoomOnEveryCard(api);
  const { dataset, path } = await seedOneTaskPerCard(api, pool, credentialId);

  await goToDataProtection(page);

  await expect(page.locator(snapshotTaskLocators.card.dataset(dataset))).toHaveText(dataset);
  await expect(page.locator(replicationTaskLocators.card.name(replicationName))).toHaveText(replicationName);
  await expect(page.locator(rsyncTaskLocators.card.path(path, rsyncRemoteHost))).toHaveText(path);
  await expect(page.locator(cloudSyncLocators.card.description(cloudSyncDescription)))
    .toHaveText(cloudSyncDescription);

  // A card with a row shows no empty state beside it.
  for (const empty of [
    snapshotTaskLocators.card.empty,
    replicationTaskLocators.card.empty,
    rsyncTaskLocators.card.empty,
    cloudSyncLocators.card.empty,
  ]) {
    await expect(page.locator(empty)).toBeHidden();
  }

  // And the one card with nothing to show still renders beside the four that do.
  expect(await countCloudBackupTasks(api)).toBe(0);
  await expect(page.locator(cloudBackupLocators.card.empty)).toBeVisible();
});

test('each card title on Data Protection opens the full list of its own tasks', async ({ page }) => {
  const cards: FullListCase[] = [
    {
      name: 'Periodic Snapshot Tasks',
      link: snapshotTaskLocators.card.open,
      route: /\/data-protection\/snapshot\/?$/,
      arrived: snapshotTaskLocators.list.add,
    },
    {
      name: 'Replication Tasks',
      link: replicationTaskLocators.card.open,
      route: /\/data-protection\/replication\/?$/,
      arrived: replicationTaskLocators.list.add,
    },
    {
      name: 'Rsync Tasks',
      link: rsyncTaskLocators.card.open,
      route: /\/data-protection\/rsync\/?$/,
      arrived: rsyncTaskLocators.list.add,
    },
    {
      name: 'Cloud Sync Tasks',
      link: cloudSyncLocators.card.open,
      route: /\/data-protection\/cloudsync\/?$/,
      arrived: cloudSyncLocators.list.add,
    },
    {
      name: 'TrueCloud Backup Tasks',
      link: cloudBackupLocators.card.open,
      route: /\/data-protection\/cloud-backup\/?$/,
      arrived: cloudBackupLocators.list.add,
    },
  ];

  for (const { name, ...card } of cards) {
    await test.step(name, async () => {
      await openFullListFromCard(page, card);
    });
  }
});

test('View All on a card holding more tasks than it lists opens the full list', async ({ page, api, pool }) => {
  for (const leaf of leaves) {
    await ensureSnapshotTaskPresent(api, {
      dataset: `${pool}/${leaf}`, namingSchema: snapshotNamingSchema, schedule: monthly,
    });
  }
  expect(await countSnapshotTasks(api)).toBeGreaterThan(cardPageSize);

  await goToDataProtection(page);
  // The card stops at its page size, which is what View All is there for.
  await expect(page.locator(snapshotTaskLocators.card.anyRow)).toHaveCount(cardPageSize);

  await openFullListFromCard(page, {
    link: snapshotTaskLocators.card.viewAll,
    route: /\/data-protection\/snapshot\/?$/,
    arrived: snapshotTaskLocators.list.add,
  });
});

test('the Enabled switch on a card row turns that task off and on again on the appliance', async ({
  page, api, pool,
}) => {
  await requireRoomOnEveryCard(api);
  const { dataset, path } = await seedOneTaskPerCard(api, pool, credentialId);

  const rows: RowToggleCase[] = [
    {
      name: 'periodic snapshot',
      toggle: snapshotTaskLocators.card.enabledToggle(dataset),
      enabled: async () => (await findSnapshotTask(api, dataset))?.enabled,
    },
    {
      name: 'replication',
      toggle: replicationTaskLocators.card.enabledToggle(replicationName),
      enabled: async () => (await findReplicationTask(api, replicationName))?.enabled,
    },
    {
      name: 'rsync',
      toggle: rsyncTaskLocators.card.enabledToggle(path, rsyncRemoteHost),
      enabled: async () => (await findRsyncTask(api, path))?.enabled,
    },
    {
      name: 'cloud sync',
      toggle: cloudSyncLocators.card.enabledToggle(cloudSyncDescription),
      enabled: async () => (await findCloudSyncTask(api, cloudSyncDescription))?.enabled,
    },
  ];

  for (const row of rows) {
    await test.step(row.name, async () => {
      // Seeded enabled, so a task read back as off can only have been switched off by this click.
      expect(await row.enabled(), `the ${row.name} task before the switch`).toBe(true);

      await toggleCardTaskEnabled(page, row.toggle);
      await expect.poll(row.enabled, { message: `the ${row.name} task after switching it off` }).toBe(false);

      // Every other card's task is a bystander: the switch wrote to the row it sits on and nothing else.
      for (const other of rows.filter((candidate) => candidate !== row)) {
        expect(await other.enabled(), `the ${other.name} task while ${row.name} is off`).toBe(true);
      }

      await toggleCardTaskEnabled(page, row.toggle);
      await expect.poll(row.enabled, { message: `the ${row.name} task after switching it on` }).toBe(true);
    });
  }
});
