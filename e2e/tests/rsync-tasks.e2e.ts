/**
 * Stories: an admin adds, edits and deletes a rsync task from the card on Data
 * Protection, and the appliance holds what they did.
 *
 * Each action is asserted twice, the way the other card specs do it: the card's
 * row says the screen believed it, and `rsynctask.query` says the appliance did
 * it — and carries what the card does not show at all, the remote end, the
 * direction, the schedule and the transfer options.
 *
 * Edit and delete each act beside a second task that must come through
 * untouched. The row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug would act on the
 * wrong task without failing anything else.
 *
 * Every task is in Module mode against a host where no rsync daemon listens —
 * see `fixtures/rsync-tasks.ts` — and syncs a dataset of its own, made fresh
 * for each test, because the card names a row by its path.
 */
import {
  countRsyncTasks,
  ensureRsyncTaskPresent,
  ensureRsyncTasksAbsent,
  findRsyncTask,
  findRsyncTasks,
  rsyncRemoteHost,
  type RsyncTaskSchedule,
} from '../fixtures/rsync-tasks';
import { datasetMountPath, ensureDatasetAbsent, ensureDatasetPresent } from '../fixtures/storage';
import {
  chooseRsyncTaskDirection,
  chooseRsyncTaskSchedule,
  chooseRsyncTaskUser,
  deleteRsyncTask,
  fillRsyncTaskPath,
  openAddRsyncTaskForm,
  openEditRsyncTaskForm,
  rsyncTaskCardPageSize,
  saveRsyncTaskForm,
} from '../flows/rsync-tasks';
import { hourlyScheduleLabel } from '../locators/cron';
import { rsyncTaskLocators } from '../locators/rsync-tasks';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const user = 'root';

/** Synced by a task created through the form, never over the API — that is the thing under test. */
const createdLeaf = 'e2e_rsync_created';
const createdModule = 'e2e-created';

/** Synced by a task provisioned over the API, so there is something to edit or delete. */
const targetLeaf = 'e2e_rsync_target';
const targetModule = 'e2e-target';
const targetDescription = 'Target rsync task';

/** What the edit test changes the target's module and description to. */
const editedModule = 'e2e-edited';
const editedDescription = 'Edited from the card';

/** Synced by the task that must survive whatever is done to the target. */
const bystanderLeaf = 'e2e_rsync_bystander';
const bystanderModule = 'e2e-bystander';
const bystanderDescription = 'Bystander rsync task';

const allLeaves = [createdLeaf, targetLeaf, bystanderLeaf];

/** The first of every month, which no preset the tests pick can be confused with. */
const monthly: RsyncTaskSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: RsyncTaskSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

/**
 * Fails up front when the card cannot show every row a test needs.
 *
 * The card lists four tasks before its pager, and the pager leaves for the full
 * list rather than expanding — see `rsyncTaskCardPageSize`. A fresh appliance
 * holds none; failing here says why rather than timing out on a hidden row.
 */
async function requireRoomOnCard(api: E2eApiClient, adding: number): Promise<void> {
  const existing = await countRsyncTasks(api);
  expect(
    existing + adding <= rsyncTaskCardPageSize,
    `the card lists ${rsyncTaskCardPageSize} tasks, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/** Both tasks over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient, pool: string): Promise<void> {
  await ensureRsyncTaskPresent(api, {
    path: datasetMountPath(`${pool}/${targetLeaf}`),
    remoteModule: targetModule,
    description: targetDescription,
    schedule: monthly,
  });
  await ensureRsyncTaskPresent(api, {
    path: datasetMountPath(`${pool}/${bystanderLeaf}`),
    remoteModule: bystanderModule,
    description: bystanderDescription,
    schedule: monthly,
  });
}

/**
 * Tasks first, then their datasets, so nothing is left pointing at a path that
 * is gone. Run before each test as well as after, so an interrupted run leaves
 * the next one able to start.
 */
test.beforeEach(async ({ api, pool }) => {
  for (const leaf of allLeaves) {
    await ensureRsyncTasksAbsent(api, datasetMountPath(`${pool}/${leaf}`));
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

test('an admin adds a rsync task, and the appliance really has one', async ({ page, api, pool }) => {
  const path = datasetMountPath(`${pool}/${createdLeaf}`);
  const description = 'Created from the card';
  await requireRoomOnCard(api, 1);

  const { form, card } = rsyncTaskLocators;
  await openAddRsyncTaskForm(page);
  await fillRsyncTaskPath(page, path);
  await chooseRsyncTaskUser(page, user);
  await chooseRsyncTaskDirection(page, 'Push');
  await page.locator(form.description).fill(description);
  await page.locator(form.remoteHost).fill(rsyncRemoteHost);
  await page.locator(form.remoteModule).fill(createdModule);
  // The form starts with no schedule and will not save without one.
  await chooseRsyncTaskSchedule(page, hourlyScheduleLabel);
  // One default flipped each way, so a stored value can only have come from these clicks.
  await page.locator(form.recursive).click();
  await page.locator(form.archive).click();
  await saveRsyncTaskForm(page);

  await expect(page.locator(card.path(path, rsyncRemoteHost))).toHaveText(path);

  expect(await findRsyncTasks(api, path)).toHaveLength(1);
  expect(await findRsyncTask(api, path)).toMatchObject({
    path,
    user,
    direction: 'PUSH',
    desc: description,
    mode: 'MODULE',
    remotehost: rsyncRemoteHost,
    remotemodule: createdModule,
    schedule: hourly,
    recursive: false,
    archive: true,
    // Untouched in the form, so they have to come back out as its defaults.
    times: true,
    compress: true,
    delete: false,
    delayupdates: true,
    enabled: true,
  });
});

test('editing a rsync task from the card changes the task that was picked', async ({ page, api, pool }) => {
  const target = datasetMountPath(`${pool}/${targetLeaf}`);
  const bystander = datasetMountPath(`${pool}/${bystanderLeaf}`);
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);
  const before = await findRsyncTask(api, target);

  const { form, card } = rsyncTaskLocators;
  await openEditRsyncTaskForm(page, { path: target, remoteHost: rsyncRemoteHost, description: targetDescription });
  await page.locator(form.description).fill(editedDescription);
  await page.locator(form.remoteModule).fill(editedModule);
  await chooseRsyncTaskDirection(page, 'Pull');
  await chooseRsyncTaskSchedule(page, hourlyScheduleLabel);
  await page.locator(form.enabled).click();
  await saveRsyncTaskForm(page);

  // Neither the path nor the host changed, so the row keeps its ids.
  await expect(page.locator(card.path(target, rsyncRemoteHost))).toHaveText(target);

  // The same record, by id, and still the only one on the path: an update, not
  // a delete and a create that happen to leave the card looking the same.
  expect(await findRsyncTasks(api, target)).toHaveLength(1);
  expect(await findRsyncTask(api, target)).toMatchObject({
    id: before?.id,
    desc: editedDescription,
    remotemodule: editedModule,
    direction: 'PULL',
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    user,
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

test('deleting a rsync task from the card removes the task that was picked', async ({ page, api, pool }) => {
  const target = datasetMountPath(`${pool}/${targetLeaf}`);
  const bystander = datasetMountPath(`${pool}/${bystanderLeaf}`);
  await requireRoomOnCard(api, 2);
  await seedTargetAndBystander(api, pool);

  await deleteRsyncTask(page, target, rsyncRemoteHost);

  // Polled rather than read once: the card reloads after the call, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findRsyncTask(api, target)).toBeUndefined();

  // The whole point of the second task: the card looks right either way.
  await expect(page.locator(rsyncTaskLocators.card.row(bystander, rsyncRemoteHost))).toBeVisible();
  expect(await findRsyncTask(api, bystander)).toBeDefined();
});
