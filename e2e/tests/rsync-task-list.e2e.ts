/**
 * Stories: an admin opens the full Rsync Tasks list from its card on Data
 * Protection, searches it down to the task they want, and runs, edits and
 * deletes a task from its row. The appliance holds what they did.
 *
 * The card's own journeys are `rsync-tasks.e2e.ts` and `rsync-task-run.e2e.ts`.
 * The list is a different page, with its own search and its own row actions,
 * under ids of its own (see `rsyncTaskLocators.list`), so nothing those specs
 * pass says anything about it.
 *
 * Every action acts beside a second task that must come through untouched. The
 * row's actions sit in a kebab menu, so an action belongs to whichever row's
 * menu was opened, and a row-targeting bug would act on the wrong task without
 * failing anything else.
 *
 * The list has no Enabled switch: Enabled is a Yes/No cell. Switching a task off
 * from the list goes through the edit form's checkbox, so the edit test does it.
 *
 * The run test's task pushes over SSH to the appliance itself, the way
 * `rsync-task-run.e2e.ts` does, so a run really copies a file. Every other task
 * is in Module mode against a host where no rsync daemon listens (see
 * `fixtures/rsync-tasks.ts`), and every task syncs a dataset of its own, made
 * fresh for each test, because the list names a row by its path.
 */
import { findFileNames, writeFileOnAppliance } from '../fixtures/cloud-sync';
import {
  ensureRsyncSshTaskPresent,
  ensureRsyncTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncRunJobIds,
  findRsyncRuns,
  findRsyncTask,
  findRsyncTasks,
  rsyncRemoteHost,
  type RsyncTaskSchedule,
} from '../fixtures/rsync-tasks';
import { directoryExists } from '../fixtures/snapshots';
import {
  ensureLoopbackSshAccessAbsent,
  ensureLoopbackSshConnectionPresent,
  ensureSshConnectionAbsent,
} from '../fixtures/ssh-connections';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import { searchTaskList } from '../flows/data-protection';
import {
  chooseRsyncTaskDirection,
  chooseRsyncTaskSchedule,
  deleteRsyncTaskFromList,
  openEditRsyncTaskFormFromList,
  openRsyncTaskList,
  runRsyncTaskFromList,
  saveRsyncTaskForm,
} from '../flows/rsync-tasks';
import { hourlyScheduleLabel } from '../locators/cron';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** A push of one small file over loopback SSH is seconds; this is room for a slow appliance. */
const runTimeoutMs = 120_000;

/** The SSH connection the run test's task signs in with. Set up over the API: it is not under test. */
const connectionName = 'e2e-rsynclist-loopback';

/** Synced by the task an action is aimed at. */
const targetLeaf = 'e2e_rsynclist_target';
const targetModule = 'e2e-rsynclist-target';
const targetDescription = 'E2E rsync list target';

/** What the edit test changes the target's module and description to. */
const editedModule = 'e2e-rsynclist-edited';
const editedDescription = 'E2E rsync list edited';

/** Synced by the task that must survive whatever is done to the target. */
const bystanderLeaf = 'e2e_rsynclist_bystander';
const bystanderModule = 'e2e-rsynclist-bystander';
const bystanderDescription = 'E2E rsync list bystander';

/** Where the run test's task copies the target's dataset to. */
const copyLeaf = 'e2e_rsynclist_copy';

const allLeaves = [targetLeaf, bystanderLeaf, copyLeaf];

/** What a run copies. Written fresh for the test that needs one. */
const seededFile = 'e2e-rsynclist.txt';

/** The first of every month, which no preset the tests pick can be confused with. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: RsyncTaskSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

let connectionId: number;

interface SeededPaths {
  target: string;
  bystander: string;
}

function seededPaths(pool: string): SeededPaths {
  return {
    target: datasetMountPath(`${pool}/${targetLeaf}`),
    bystander: datasetMountPath(`${pool}/${bystanderLeaf}`),
  };
}

/** The bystander over the API, in Module mode: it is never run. */
async function seedBystander(api: E2eApiClient, pool: string): Promise<void> {
  await ensureRsyncTaskPresent(api, {
    path: seededPaths(pool).bystander,
    remoteModule: bystanderModule,
    description: bystanderDescription,
    schedule: monthly,
  });
}

/** Both tasks over the API, in Module mode: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<SeededPaths> {
  const paths = seededPaths(pool);
  await ensureRsyncTaskPresent(api, {
    path: paths.target,
    remoteModule: targetModule,
    description: targetDescription,
    schedule: monthly,
  });
  await seedBystander(api, pool);
  return paths;
}

/**
 * The connection, root's key and SSH are set up once for the file: none of them
 * is under test. Tasks go first because middleware will not delete a connection
 * a task uses, so a run interrupted mid-file leaves the next one able to start.
 */
test.beforeAll(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
  }
  connectionId = await ensureLoopbackSshConnectionPresent(api, connectionName);
});

/**
 * Tasks first, then their datasets, so nothing is left pointing at a path that
 * is gone. The datasets are made fresh, so the copy target holds nothing until a
 * run copies something into it.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the rsync tasks on and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the rsync tasks on "${datasetMountPath(dataset)}"`,
      () => ensureRsyncTasksAbsent(api, datasetMountPath(dataset)),
    ]),
    ...datasets.map((dataset): [string, () => Promise<void>] => [
      `remove the dataset "${dataset}"`, () => ensureDatasetAbsent(api, dataset),
    ]),
  ]);
});

/** Separate steps, so a connection that will not delete still has root's key taken back out. */
test.afterAll(async ({ api, pool }) => {
  if (leavingTestData(`the SSH connection "${connectionName}", its keypair and root's key`)) {
    return;
  }

  const paths = allLeaves.map((leaf) => datasetMountPath(`${pool}/${leaf}`));
  await runCleanupSteps([
    ...paths.map((path): [string, () => Promise<void>] => [
      `remove the rsync tasks on "${path}"`, () => ensureRsyncTasksAbsent(api, path),
    ]),
    [`remove the SSH connection "${connectionName}"`, () => ensureSshConnectionAbsent(api, connectionName)],
    ['remove root\'s loopback key, its keypair, and SSH if it was started', () => (
      ensureLoopbackSshAccessAbsent(api, connectionName)
    )],
  ]);
});

test('searching the full Rsync Tasks list narrows it to the task that matches', async ({ page, api, pool }) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const { list } = rsyncTaskLocators;

  await openRsyncTaskList(page);
  // Both are listed before the search, so the bystander going is the search's doing.
  await expect(page.locator(list.row(target, rsyncRemoteHost))).toBeVisible();
  await expect(page.locator(list.row(bystander, rsyncRemoteHost))).toBeVisible();

  // By description, one of the two columns the list searches. No other task's path or description holds it.
  await searchTaskList(page, targetDescription);

  await expect(page.locator(list.path(target, rsyncRemoteHost))).toHaveText(target);
  await expect(page.locator(list.anyRow)).toHaveCount(1);
});

test('running a rsync task from the full list copies the files of the task that was picked', async ({
  page, api, pool,
}) => {
  const { target: source, bystander } = seededPaths(pool);
  const copyTarget = datasetMountPath(`${pool}/${copyLeaf}`);
  // No trailing slash on the source, so rsync copies the directory itself into the copy target.
  const copied = `${copyTarget}/${targetLeaf}`;

  await writeFileOnAppliance(api, source, seededFile);
  await ensureRsyncSshTaskPresent(api, {
    path: source,
    connectionId,
    remotePath: copyTarget,
    description: targetDescription,
    schedule: monthly,
  });
  await seedBystander(api, pool);
  const task = await findRsyncTask(api, source);
  const bystanderTask = await findRsyncTask(api, bystander);
  // Without both ids, the run reads below would match no job and pass for nothing.
  if (!task || !bystanderTask) {
    throw new Error(`rsynctask.query has no task on "${source}" or on "${bystander}" after creating both.`);
  }
  const earlierRuns = await findRsyncRunJobIds(api);
  // Nothing has been copied yet, so the directory existing afterwards is the run's.
  expect(await directoryExists(api, copied)).toBe(false);

  await runRsyncTaskFromList(page, source, rsyncRemoteHost);

  await expect.poll(
    async () => (await findRsyncRuns(api, task.id, earlierRuns)).map((run) => run.state),
    { timeout: runTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findFileNames(api, copied)).toEqual([seededFile]);
  await expect(page.locator(rsyncTaskLocators.list.status(source, rsyncRemoteHost))).toHaveText('Completed');

  // The whole point of the second task: the list looks the same either way.
  await expect(page.locator(rsyncTaskLocators.list.row(bystander, rsyncRemoteHost))).toBeVisible();
  expect(await findRsyncRuns(api, bystanderTask.id, earlierRuns)).toEqual([]);
});

test('editing a rsync task from the full list changes the task that was picked', async ({ page, api, pool }) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const before = await findRsyncTask(api, target);

  const { form, list } = rsyncTaskLocators;
  await openEditRsyncTaskFormFromList(page, {
    path: target, remoteHost: rsyncRemoteHost, description: targetDescription,
  });
  await page.locator(form.description).fill(editedDescription);
  await page.locator(form.remoteModule).fill(editedModule);
  await chooseRsyncTaskDirection(page, 'Pull');
  await chooseRsyncTaskSchedule(page, hourlyScheduleLabel);
  // Seeded enabled, and the list has no switch: this is how the list turns a task off.
  await page.locator(form.enabled).click();
  await saveRsyncTaskForm(page);

  // Neither the path nor the host changed, so the row keeps its ids.
  await expect(page.locator(list.path(target, rsyncRemoteHost))).toHaveText(target);

  // The same record, by id, and still the only one on the path: an update, not
  // a delete and a create that happen to leave the list looking the same.
  expect(await findRsyncTasks(api, target)).toHaveLength(1);
  expect(await findRsyncTask(api, target)).toMatchObject({
    id: before?.id,
    desc: editedDescription,
    remotemodule: editedModule,
    direction: 'PULL',
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    user: 'root',
    mode: 'MODULE',
    remotehost: rsyncRemoteHost,
  });

  expect(await findRsyncTask(api, bystander)).toMatchObject({
    desc: bystanderDescription,
    remotemodule: bystanderModule,
    direction: 'PUSH',
    schedule: monthly,
    enabled: true,
  });
});

test('deleting a rsync task from the full list removes the task that was picked', async ({ page, api, pool }) => {
  const { target, bystander } = await seedTargetAndBystander(api, pool);

  await deleteRsyncTaskFromList(page, target, rsyncRemoteHost);

  // Polled rather than read once: the list reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findRsyncTask(api, target)).toBeUndefined();

  // The whole point of the second task: the list looks right either way.
  await expect(page.locator(rsyncTaskLocators.list.row(bystander, rsyncRemoteHost))).toBeVisible();
  expect(await findRsyncTask(api, bystander)).toBeDefined();
});
