/**
 * Stories: an admin creates, edits, runs, restores and deletes a cloud sync task
 * from the card on Data Protection, and the appliance holds what they did.
 *
 * Every task syncs through an SFTP credential that points back at the appliance
 * itself — see `fixtures/cloud-sync.ts` — so no outside service is needed and
 * the remote end is a dataset this spec can read back. That is what lets the run
 * and the restore be checked by what they actually copied, which appears
 * nowhere on the screen.
 *
 * Each action is asserted on the card and on the appliance: `cloudsync.query`
 * for the task as stored, `core.get_jobs` for whether a run worked, and
 * `filesystem.listdir` for what it copied.
 *
 * Edit, run, dry run, custom transfers and delete each act beside a second task
 * that must come through untouched. The row's actions sit in a kebab menu, so an
 * action belongs to whichever row's menu was opened, and a row-targeting bug
 * would act on the wrong task without failing anything else.
 *
 * Every other test types its folders. One edit picks the remote folder in the
 * Folder picker instead, which is the only thing here that has the remote list
 * its directories (`cloudsync.list_directory`).
 *
 * Stopping needs a run that lasts: the task is given a bandwidth limit and a
 * file large enough that the run would take minutes, and is stopped long
 * before then.
 */
import {
  cloudSyncRunTimeoutMs,
  type CloudSyncSchedule,
  countCloudSyncTasks,
  ensureCloudSyncTaskPresent,
  ensureCloudSyncTasksAbsent,
  type CloudSyncBandwidthLimit,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncRunJobIds,
  findCloudSyncRuns,
  findCloudSyncTask,
  findCloudSyncTasks,
  findFileNames,
  loopbackCredentialName,
  loopbackProviderLabel,
  runCloudSyncTask,
  writeFileOnAppliance,
} from '../fixtures/cloud-sync';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  chooseCloudSyncCredential,
  chooseCloudSyncCustomTransfers,
  chooseCloudSyncFormSchedule,
  chooseCloudSyncTransferMode,
  chooseCloudSyncWizardSchedule,
  cloudSyncCardPageSize,
  deleteCloudSyncTask,
  dryRunCloudSyncTaskFromCard,
  fillCloudSyncPull,
  fillCloudSyncPush,
  openCloudSyncWizard,
  openEditCloudSyncForm,
  restoreCloudSyncTask,
  runCloudSyncTaskFromCard,
  saveCloudSyncForm,
  saveCloudSyncWizard,
  stopCloudSyncTaskFromCard,
} from '../flows/cloud-sync';
import { openExplorer, openExplorerDirectory, pickExplorerEntry } from '../flows/explorer';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { hourlyScheduleLabel } from '../locators/cron';
import { explorerLocators } from '../locators/explorer';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Made through the wizard, never over the API — that is the thing under test. */
const createdDescription = 'E2E cloud sync created';
const pulledDescription = 'E2E cloud sync pulled';

/** Provisioned over the API, so there is something to edit, run, restore or delete. */
const targetDescription = 'E2E cloud sync target';

/** Provisioned beside it, and must come through untouched. */
const bystanderDescription = 'E2E cloud sync bystander';

/** What the restore dialog names the task it creates. */
const restoredDescription = 'E2E cloud sync restored';

const allDescriptions = [
  createdDescription,
  pulledDescription,
  targetDescription,
  bystanderDescription,
  restoredDescription,
];

/** The local directory a task sends, and where a restore brings files back to. */
const sourceLeaf = 'e2e_cloudsync_src';
const restoreLeaf = 'e2e_cloudsync_restore';
/** The "remote": the folder on the loopback SFTP host a task syncs into. */
const remoteLeaf = 'e2e_cloudsync_remote';
const bystanderSourceLeaf = 'e2e_cloudsync_bystander_src';
const bystanderRemoteLeaf = 'e2e_cloudsync_bystander_remote';
/** A second folder on the remote, beside `remoteLeaf`, for the edit form's Folder picker to move a task to. */
const browsedLeaf = 'e2e_cloudsync_browsed';

const allLeaves = [sourceLeaf, restoreLeaf, remoteLeaf, bystanderSourceLeaf, bystanderRemoteLeaf, browsedLeaf];

/** What a run copies. Written fresh for each test that needs one. */
const seededFile = 'e2e-cloudsync.txt';

/**
 * What a run that is to be stopped copies: 32 MiB at 64 KiB a second is over
 * eight minutes, so the run is still going whenever Stop is pressed. One entry
 * from midnight on applies the limit all day.
 */
const largeFile = 'e2e-cloudsync-large.bin';
const largeFileBytes = 32 * 1024 * 1024;
const slowLimit: CloudSyncBandwidthLimit[] = [{ time: '00:00', bandwidth: 64 * 1024 }];

/** Not one of the Transfers presets (4, 8 and 16), so it can only be stored through Custom. */
const customTransfers = 12;

/** The first of every month, which no preset the tests pick can be confused with. */
const monthly: CloudSyncSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: CloudSyncSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

let credentialId: number;

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four tasks before its pager, and the pager leaves for the full
 * list rather than expanding — see `cloudSyncCardPageSize`. A fresh appliance
 * holds none; failing here says why rather than timing out on a hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countCloudSyncTasks(api);
  expect(
    existing + adding <= cloudSyncCardPageSize,
    `the card lists ${cloudSyncCardPageSize} tasks, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/** Both tasks over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<void> {
  await ensureCloudSyncTaskPresent(api, {
    description: targetDescription,
    credentialId,
    path: datasetMountPath(`${pool}/${sourceLeaf}`),
    remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
    schedule: monthly,
  });
  await ensureCloudSyncTaskPresent(api, {
    description: bystanderDescription,
    credentialId,
    path: datasetMountPath(`${pool}/${bystanderSourceLeaf}`),
    remoteFolder: datasetMountPath(`${pool}/${bystanderRemoteLeaf}`),
    schedule: monthly,
  });
}

/**
 * The credential, root's key and SSH are set up once for the file: none of them
 * is under test, and each test owns only its tasks and datasets. Torn down
 * before setup too, so a run interrupted mid-file leaves the next one able to
 * start.
 */
test.beforeAll(async ({ api }) => {
  for (const description of allDescriptions) {
    await ensureCloudSyncTasksAbsent(api, description);
  }
  credentialId = await ensureLoopbackSftpCredentialPresent(api);
});

/**
 * Tasks first, then their datasets, so nothing is left pointing at a path that
 * is gone. Run before each test as well as after, so every test starts from
 * empty directories.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const description of allDescriptions) {
    await ensureCloudSyncTasksAbsent(api, description);
  }
  for (const leaf of allLeaves) {
    await ensureDatasetAbsent(api, `${pool}/${leaf}`);
    await ensureDatasetPresent(api, `${pool}/${leaf}`);
  }
});

test.afterEach(async ({ api, pool }) => {
  const datasets = allLeaves.map((leaf) => `${pool}/${leaf}`);
  if (leavingTestData(`the cloud sync tasks ${allDescriptions.join(', ')} and the datasets ${datasets.join(', ')}`)) {
    return;
  }

  await runCleanupSteps([
    ...allDescriptions.map((description): [string, () => Promise<void>] => [
      `remove the cloud sync tasks "${description}"`, () => ensureCloudSyncTasksAbsent(api, description),
    ]),
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
    ...allDescriptions.map((description): [string, () => Promise<void>] => [
      `remove the cloud sync tasks "${description}"`, () => ensureCloudSyncTasksAbsent(api, description),
    ]),
    ['remove the loopback SFTP credential', () => ensureLoopbackSftpCredentialAbsent(api)],
  ]);
});

test('an admin adds a cloud sync task, and the appliance really has one', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remoteFolder = datasetMountPath(`${pool}/${remoteLeaf}`);
  await requireRoomOnCard(api, 1);

  await openCloudSyncWizard(page);
  await chooseCloudSyncCredential(page, loopbackCredentialName, loopbackProviderLabel);
  await fillCloudSyncPush(page, { path, remoteFolder, description: createdDescription });
  // Daily is the wizard's default, so a stored hourly can only have come from this pick.
  await chooseCloudSyncWizardSchedule(page, hourlyScheduleLabel);
  await saveCloudSyncWizard(page);

  await expect(page.locator(cloudSyncLocators.card.description(createdDescription))).toHaveText(createdDescription);

  expect(await findCloudSyncTasks(api, createdDescription)).toHaveLength(1);
  expect(await findCloudSyncTask(api, createdDescription)).toMatchObject({
    description: createdDescription,
    credentials: { id: credentialId },
    direction: 'PUSH',
    path,
    attributes: { folder: remoteFolder },
    schedule: hourly,
    // Untouched in the wizard, so they have to come back out as its defaults.
    transfer_mode: 'COPY',
    enabled: true,
  });
});

test('a pull task made in the wizard keeps the direction, mode and folders that were picked', async ({
  page,
  api,
  pool,
}) => {
  const path = datasetMountPath(`${pool}/${restoreLeaf}`);
  const remoteFolder = datasetMountPath(`${pool}/${remoteLeaf}`);
  await requireRoomOnCard(api, 1);

  await openCloudSyncWizard(page);
  await chooseCloudSyncCredential(page, loopbackCredentialName, loopbackProviderLabel);
  // SYNC is not the wizard's default (COPY), and the push test above leaves the mode alone.
  await fillCloudSyncPull(page, {
    remoteFolder,
    path,
    transferMode: 'SYNC',
    description: pulledDescription,
  });
  await chooseCloudSyncWizardSchedule(page, hourlyScheduleLabel);
  await saveCloudSyncWizard(page);

  await expect(page.locator(cloudSyncLocators.card.description(pulledDescription))).toHaveText(pulledDescription);

  // A pull stores the local side as `path` and the remote as `attributes.folder`,
  // the opposite way round from what the two explorers are called, so a swap
  // between them in the wizard's payload shows here.
  expect(await findCloudSyncTasks(api, pulledDescription)).toHaveLength(1);
  expect(await findCloudSyncTask(api, pulledDescription)).toMatchObject({
    description: pulledDescription,
    credentials: { id: credentialId },
    direction: 'PULL',
    transfer_mode: 'SYNC',
    path,
    attributes: { folder: remoteFolder },
    schedule: hourly,
    enabled: true,
  });
});

test('editing a cloud sync task from the card changes the task that was picked', async ({ page, api, pool }) => {
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  const before = await findCloudSyncTask(api, targetDescription);

  const { form, card } = cloudSyncLocators;
  await openEditCloudSyncForm(page, targetDescription);
  await chooseCloudSyncTransferMode(page, 'SYNC');
  await chooseCloudSyncFormSchedule(page, hourlyScheduleLabel);
  await page.locator(form.enabled).click();
  await saveCloudSyncForm(page);

  // The description did not change, so the row keeps its ids.
  await expect(page.locator(card.description(targetDescription))).toHaveText(targetDescription);

  // The same record, by id, and still the only one with this description: an
  // update, not a delete and a create that happen to leave the card looking the same.
  expect(await findCloudSyncTasks(api, targetDescription)).toHaveLength(1);
  expect(await findCloudSyncTask(api, targetDescription)).toMatchObject({
    id: before?.id,
    transfer_mode: 'SYNC',
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    direction: 'PUSH',
    path: datasetMountPath(`${pool}/${sourceLeaf}`),
    attributes: { folder: datasetMountPath(`${pool}/${remoteLeaf}`) },
    credentials: { id: credentialId },
  });

  expect(await findCloudSyncTask(api, bystanderDescription)).toMatchObject({
    transfer_mode: 'COPY',
    schedule: monthly,
    enabled: true,
  });
});

test('an admin picks a task\'s remote folder by browsing the SFTP host', async ({ page, api, pool }) => {
  const browsedFolder = datasetMountPath(`${pool}/${browsedLeaf}`);
  const base = cloudSyncLocators.form.folderDestinationExplorer;
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  const before = await findCloudSyncTask(api, targetDescription);

  await openEditCloudSyncForm(page, targetDescription);
  // The root of the remote is the SFTP host's `/`, which is this appliance's,
  // so `mnt` here is the remote's listing rather than anything local.
  await openExplorer(page, base, 'mnt');
  await openExplorerDirectory(page, base, 'mnt');
  await openExplorerDirectory(page, base, pool);
  await expect(page.locator(explorerLocators.entry(base, remoteLeaf))).toBeVisible();
  await expect(page.locator(explorerLocators.entry(base, browsedLeaf))).toBeVisible();

  await pickExplorerEntry(page, base, browsedLeaf, { multiple: false });
  await expect(page.locator(cloudSyncLocators.form.folderDestination)).toHaveValue(browsedFolder);
  await saveCloudSyncForm(page);

  // The same task, moved to the picked folder, with its local side as it was.
  expect(await findCloudSyncTask(api, targetDescription)).toMatchObject({
    id: before?.id,
    path: datasetMountPath(`${pool}/${sourceLeaf}`),
    attributes: { folder: browsedFolder },
  });
  expect(await findCloudSyncTask(api, bystanderDescription)).toMatchObject({
    attributes: { folder: datasetMountPath(`${pool}/${bystanderRemoteLeaf}`) },
  });
});

test('custom transfers saved from the edit form reach the task that was picked', async ({ page, api, pool }) => {
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  const before = await findCloudSyncTask(api, targetDescription);
  const bystanderBefore = await findCloudSyncTask(api, bystanderDescription);
  // Otherwise the assertion below holds before the dialog is ever opened.
  expect(before?.transfers).not.toBe(customTransfers);

  await openEditCloudSyncForm(page, targetDescription);
  await chooseCloudSyncCustomTransfers(page, customTransfers);
  await saveCloudSyncForm(page);

  expect(await findCloudSyncTask(api, targetDescription)).toMatchObject({
    id: before?.id,
    transfers: customTransfers,
  });
  expect((await findCloudSyncTask(api, bystanderDescription))?.transfers).toBe(bystanderBefore?.transfers);
});

test('running a cloud sync task from the card copies its files to the remote', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  const bystanderSource = datasetMountPath(`${pool}/${bystanderSourceLeaf}`);
  const bystanderRemote = datasetMountPath(`${pool}/${bystanderRemoteLeaf}`);
  await requireRoomOnCard(api, 2);

  await writeFileOnAppliance(api, source, seededFile);
  await writeFileOnAppliance(api, bystanderSource, seededFile);
  await seedTargetAndBystander(api, pool);
  const task = await findCloudSyncTask(api, targetDescription);
  const bystander = await findCloudSyncTask(api, bystanderDescription);
  const earlierRuns = await findCloudSyncRunJobIds(api);
  // Nothing has been copied yet, so a file on the remote afterwards is the run's.
  expect(await findFileNames(api, remote)).toEqual([]);

  await runCloudSyncTaskFromCard(page, targetDescription);

  await expect.poll(
    async () => (await findCloudSyncRuns(api, task?.id ?? -1, earlierRuns)).map((run) => run.state),
    { timeout: cloudSyncRunTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findFileNames(api, remote)).toEqual([seededFile]);
  await expect(page.locator(cloudSyncLocators.card.state(targetDescription))).toHaveText('Completed');

  // The whole point of the second task: the card looks the same either way.
  await expect(page.locator(cloudSyncLocators.card.row(bystanderDescription))).toBeVisible();
  expect(await findCloudSyncRuns(api, bystander?.id ?? -1, earlierRuns)).toEqual([]);
  expect(await findFileNames(api, bystanderRemote)).toEqual([]);
});

test('a dry run from the card completes and copies nothing to the remote', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  await requireRoomOnCard(api, 2);

  await writeFileOnAppliance(api, source, seededFile);
  await seedTargetAndBystander(api, pool);
  const task = await findCloudSyncTask(api, targetDescription);
  const bystander = await findCloudSyncTask(api, bystanderDescription);
  const earlierRuns = await findCloudSyncRunJobIds(api);

  await dryRunCloudSyncTaskFromCard(page, targetDescription);

  // rclone names each file it would have copied, so `named` is what tells a dry
  // run that skipped the file from one that found nothing to do. Polled with the
  // state: middleware reports SUCCESS first and attaches the log in a later update.
  await expect.poll(
    async () => (await findCloudSyncRuns(api, task?.id ?? -1, earlierRuns)).map((run) => ({
      state: run.state,
      dryRun: run.dryRun,
      named: run.logs.includes(seededFile),
    })),
    { timeout: cloudSyncRunTimeoutMs },
  ).toEqual([{ state: 'SUCCESS', dryRun: true, named: true }]);
  // The one thing a dry run must not do: the same task run for real copies it (see the run test).
  expect(await findFileNames(api, remote)).toEqual([]);
  await expect(page.locator(cloudSyncLocators.card.state(targetDescription))).toHaveText('Completed');

  expect(await findCloudSyncRuns(api, bystander?.id ?? -1, earlierRuns)).toEqual([]);
});

test('stopping a running cloud sync task from the card aborts its run', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  await requireRoomOnCard(api, 1);

  await writeFileOnAppliance(api, source, largeFile, largeFileBytes);
  await ensureCloudSyncTaskPresent(api, {
    description: targetDescription,
    credentialId,
    path: source,
    remoteFolder: datasetMountPath(`${pool}/${remoteLeaf}`),
    schedule: monthly,
    bwlimit: slowLimit,
  });
  const task = await findCloudSyncTask(api, targetDescription);
  const earlierRuns = await findCloudSyncRunJobIds(api);
  const runStates = async (): Promise<string[]> => (
    (await findCloudSyncRuns(api, task?.id ?? -1, earlierRuns)).map((run) => run.state)
  );

  // Started from the card as an admin would. Stop is offered only once the row
  // knows its job is running, so both the appliance and the row are waited on.
  await runCloudSyncTaskFromCard(page, targetDescription);
  await expect.poll(runStates, { timeout: cloudSyncRunTimeoutMs }).toEqual(['RUNNING']);
  await expect(page.locator(cloudSyncLocators.card.state(targetDescription))).toHaveText('Running');

  await stopCloudSyncTaskFromCard(page, targetDescription);

  // The limit keeps this run going for minutes, so it ends inside this timeout
  // only if Stop ended it — and then as ABORTED, not SUCCESS or FAILED.
  await expect.poll(runStates, { timeout: cloudSyncRunTimeoutMs }).toEqual(['ABORTED']);
});

test('restoring from a cloud sync task makes a pull task that brings the files back', async ({ page, api, pool }) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  const restoreTo = datasetMountPath(`${pool}/${restoreLeaf}`);
  await requireRoomOnCard(api, 2);

  // The remote already holds what an earlier push would have left there.
  await writeFileOnAppliance(api, remote, seededFile);
  await ensureCloudSyncTaskPresent(api, {
    description: targetDescription,
    credentialId,
    path: source,
    remoteFolder: remote,
    schedule: monthly,
  });
  const parent = await findCloudSyncTask(api, targetDescription);

  await restoreCloudSyncTask(page, { description: targetDescription, restoredDescription, path: restoreTo });

  await expect(page.locator(cloudSyncLocators.card.description(restoredDescription)))
    .toHaveText(restoredDescription);

  // The opposite of the parent: from its remote folder to the path picked in
  // the dialog, with the dialog's default transfer mode.
  expect(await findCloudSyncTasks(api, restoredDescription)).toHaveLength(1);
  const restored = await findCloudSyncTask(api, restoredDescription);
  expect(restored).toMatchObject({
    direction: 'PULL',
    path: restoreTo,
    attributes: { folder: remote },
    transfer_mode: 'COPY',
    credentials: { id: credentialId },
  });
  expect(restored?.id).not.toBe(parent?.id);

  // The parent is not changed by restoring from it.
  expect(await findCloudSyncTask(api, targetDescription)).toMatchObject({
    id: parent?.id,
    direction: 'PUSH',
    path: source,
  });

  // A restore only creates the task. Running it, over the API, checks that what
  // the dialog made really brings the remote's files back — and that the
  // directory was empty until it did.
  expect(await findFileNames(api, restoreTo)).toEqual([]);
  await runCloudSyncTask(api, restored?.id ?? -1);
  expect(await findFileNames(api, restoreTo)).toEqual([seededFile]);
});

test('deleting a cloud sync task from the card removes the task that was picked', async ({ page, api, pool }) => {
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);

  await deleteCloudSyncTask(page, targetDescription);

  // Polled rather than read once: the card reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findCloudSyncTask(api, targetDescription)).toBeUndefined();

  // The whole point of the second task: the card looks right either way.
  await expect(page.locator(cloudSyncLocators.card.row(bystanderDescription))).toBeVisible();
  expect(await findCloudSyncTask(api, bystanderDescription)).toBeDefined();
});
