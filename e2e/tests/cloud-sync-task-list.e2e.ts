/**
 * Stories: an admin opens the full Cloud Sync Tasks list from its card on Data
 * Protection, searches it down to the task they want, and runs, edits and
 * deletes a task from its row. The appliance holds what they did.
 *
 * The card's own journeys are `cloud-sync-tasks.e2e.ts`. The list is a different
 * page, with its own search, and its actions in a detail panel that opens when
 * the row is clicked rather than in a kebab menu. Its ids are its own too (see
 * `cloudSyncLocators.list`), so nothing the card spec passes says anything
 * about it.
 *
 * Every action acts beside a second task that must come through untouched. The
 * panel's actions are keyed by the task's id, so an action belongs to whichever
 * row was opened, and a row-targeting bug would act on the wrong task without
 * failing anything else.
 *
 * The list has no Enabled switch: Enabled is a Yes/No cell. Switching a task off
 * from the list goes through the edit form's checkbox, so the edit test does it.
 *
 * Every task syncs through the SFTP credential that points back at the
 * appliance itself (see `fixtures/cloud-sync.ts`), so the run can be checked by
 * what it actually copied.
 */
import {
  cloudSyncRunTimeoutMs,
  type CloudSyncSchedule,
  type CloudSyncTaskRecord,
  ensureCloudSyncTaskPresent,
  ensureCloudSyncTasksAbsent,
  ensureLoopbackSftpCredentialAbsent,
  ensureLoopbackSftpCredentialPresent,
  findCloudSyncRunJobIds,
  findCloudSyncRuns,
  findCloudSyncTask,
  findCloudSyncTasks,
  findFileNames,
  loopbackCredentialName,
  writeFileOnAppliance,
} from '../fixtures/cloud-sync';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  chooseCloudSyncFormSchedule,
  chooseCloudSyncTransferMode,
  deleteCloudSyncTaskFromList,
  openCloudSyncTaskList,
  openEditCloudSyncFormFromList,
  runCloudSyncTaskFromList,
  saveCloudSyncForm,
} from '../flows/cloud-sync';
import { searchTaskList } from '../flows/data-protection';
import { cloudSyncLocators } from '../locators/cloud-sync';
import { hourlyScheduleLabel } from '../locators/cron';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The task an action is aimed at. */
const targetDescription = 'E2E cloud sync list target';

/** The task that must come through whatever is done to the target untouched. */
const bystanderDescription = 'E2E cloud sync list bystander';

const allDescriptions = [targetDescription, bystanderDescription];

/** The local directory each task sends, and the folder on the loopback SFTP host it syncs into. */
const sourceLeaf = 'e2e_cloudlist_src';
const remoteLeaf = 'e2e_cloudlist_remote';
const bystanderSourceLeaf = 'e2e_cloudlist_bystander_src';
const bystanderRemoteLeaf = 'e2e_cloudlist_bystander_remote';

const allLeaves = [sourceLeaf, remoteLeaf, bystanderSourceLeaf, bystanderRemoteLeaf];

/** What a run copies. Written fresh for the test that needs one. */
const seededFile = 'e2e-cloudlist.txt';

/** The first of every month, which no preset the tests pick can be confused with. */
const monthly: CloudSyncSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: CloudSyncSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

let credentialId: number;

/** Both tasks over the API: acting on one from the list is the thing under test. */
async function seedTargetAndBystander(
  api: E2eApiClient,
  pool: string,
): Promise<{ target: CloudSyncTaskRecord; bystander: CloudSyncTaskRecord }> {
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

  const target = await findCloudSyncTask(api, targetDescription);
  const bystander = await findCloudSyncTask(api, bystanderDescription);
  // The list's actions are keyed by id, so without both there is nothing to aim at.
  if (!target || !bystander) {
    throw new Error(`the seeded tasks "${targetDescription}" and "${bystanderDescription}" are not both there`);
  }
  return { target, bystander };
}

/**
 * The credential, root's key and SSH are set up once for the file: none of them
 * is under test, and each test owns only its tasks and datasets. Tasks are
 * removed first, because middleware will not delete a credential a task uses.
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

test('searching the full Cloud Sync Tasks list narrows it to the task that matches', async ({
  page, api, pool,
}) => {
  await seedTargetAndBystander(api, pool);
  const { list } = cloudSyncLocators;

  await openCloudSyncTaskList(page);
  // Both are listed before the search, so the bystander going is the search's doing.
  await expect(page.locator(list.row(targetDescription))).toBeVisible();
  await expect(page.locator(list.row(bystanderDescription))).toBeVisible();

  // By description, the one column the list searches. No other task's description holds it.
  await searchTaskList(page, targetDescription);

  await expect(page.locator(list.description(targetDescription))).toHaveText(targetDescription);
  await expect(page.locator(list.anyRow)).toHaveCount(1);
});

test('running a cloud sync task from the full list copies the files of the task that was picked', async ({
  page, api, pool,
}) => {
  const source = datasetMountPath(`${pool}/${sourceLeaf}`);
  const remote = datasetMountPath(`${pool}/${remoteLeaf}`);
  const bystanderSource = datasetMountPath(`${pool}/${bystanderSourceLeaf}`);
  const bystanderRemote = datasetMountPath(`${pool}/${bystanderRemoteLeaf}`);

  await writeFileOnAppliance(api, source, seededFile);
  await writeFileOnAppliance(api, bystanderSource, seededFile);
  const { target, bystander } = await seedTargetAndBystander(api, pool);
  const earlierRuns = await findCloudSyncRunJobIds(api);
  // Nothing has been copied yet, so a file on the remote afterwards is the run's.
  expect(await findFileNames(api, remote)).toEqual([]);

  await runCloudSyncTaskFromList(page, { description: targetDescription, id: target.id });

  await expect.poll(
    async () => (await findCloudSyncRuns(api, target.id, earlierRuns)).map((run) => run.state),
    { timeout: cloudSyncRunTimeoutMs },
  ).toEqual(['SUCCESS']);
  expect(await findFileNames(api, remote)).toEqual([seededFile]);
  await expect(page.locator(cloudSyncLocators.list.state(targetDescription))).toHaveText('Completed');

  // The whole point of the second task: the list looks the same either way.
  await expect(page.locator(cloudSyncLocators.list.row(bystanderDescription))).toBeVisible();
  expect(await findCloudSyncRuns(api, bystander.id, earlierRuns)).toEqual([]);
  expect(await findFileNames(api, bystanderRemote)).toEqual([]);
});

test('editing a cloud sync task from the full list changes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target: before } = await seedTargetAndBystander(api, pool);

  const { form, list } = cloudSyncLocators;
  await openEditCloudSyncFormFromList(page, { description: targetDescription, id: before.id });
  await chooseCloudSyncTransferMode(page, 'SYNC');
  await chooseCloudSyncFormSchedule(page, hourlyScheduleLabel);
  // Seeded enabled, and the list has no switch: this is how the list turns a task off.
  await page.locator(form.enabled).click();
  await saveCloudSyncForm(page);

  // The description did not change, so the row keeps its ids.
  await expect(page.locator(list.description(targetDescription))).toHaveText(targetDescription);

  // The same record, by id, and still the only one with this description: an
  // update, not a delete and a create that happen to leave the list looking the same.
  expect(await findCloudSyncTasks(api, targetDescription)).toHaveLength(1);
  expect(await findCloudSyncTask(api, targetDescription)).toMatchObject({
    id: before.id,
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

test('deleting a cloud sync task from the full list removes the task that was picked', async ({
  page, api, pool,
}) => {
  const { target } = await seedTargetAndBystander(api, pool);

  await deleteCloudSyncTaskFromList(page, { description: targetDescription, id: target.id });

  // Polled rather than read once: the list reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findCloudSyncTasks(api, targetDescription)).toEqual([]);

  // The whole point of the second task: the list looks right either way.
  await expect(page.locator(cloudSyncLocators.list.description(bystanderDescription)))
    .toHaveText(bystanderDescription);
  expect(await findCloudSyncTasks(api, bystanderDescription)).toHaveLength(1);
});
