/**
 * Stories: an admin adds, edits, runs and deletes a cron job from the card on
 * System > Advanced Settings, and the appliance holds what they did.
 *
 * Each action is asserted twice, the way the share specs do it: the card says
 * the screen believed it, and middleware says the appliance did it. For a save
 * that is `cronjob.query`, which also carries what the card shows differently
 * or not at all, like the raw schedule and the output flags. For a run it is
 * `core.get_jobs`, because "Run job" starts a `cronjob.run` job, and only its
 * state can say whether the command actually ran.
 *
 * Run, edit and delete each act beside a second job that must come through
 * untouched. The row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug would act on the
 * wrong job without failing anything else.
 *
 * Every command is a harmless `echo` run as root. An enabled job really runs on
 * its schedule, and a run that dies before its teardown leaves one there.
 */
import {
  ensureCronjobAbsent, ensureCronjobPresent, findCronjob, findCronRuns, type CronSchedule,
} from '../fixtures/cron';
import {
  chooseCronSchedule,
  chooseCronUser,
  deleteCronJob,
  openAddCronForm,
  openEditCronForm,
  runCronJob,
  saveCronForm,
} from '../flows/cron';
import { cronLocators, hourlyScheduleLabel } from '../locators/cron';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const user = 'root';

/** Created through the form, never over the API — that is the thing under test. */
const createdCommand = 'echo e2e-cron-created';

/** Provisioned over the API so there is something to run, edit or delete. */
const targetCommand = 'echo e2e-cron-target';
const targetDescription = 'Target cron job';

/** What the edit test changes the target's command to. */
const editedCommand = 'echo e2e-cron-edited';

/** The job that must survive whatever is done to the target. */
const bystanderCommand = 'echo e2e-cron-bystander';
const bystanderDescription = 'Bystander cron job';

const allCommands = [createdCommand, targetCommand, editedCommand, bystanderCommand];

/** The form's default, "Daily": midnight every day. */
const daily: CronSchedule = {
  minute: '0', hour: '0', dom: '*', month: '*', dow: '*',
};
/** The first of every month, which no preset the edit picks can be confused with. */
const monthly: CronSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};
const hourly: CronSchedule = {
  minute: '0', hour: '*', dom: '*', month: '*', dow: '*',
};

/** Both jobs over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureCronjobPresent(api, { command: targetCommand, description: targetDescription, schedule: monthly });
  await ensureCronjobPresent(api, { command: bystanderCommand, description: bystanderDescription, schedule: monthly });
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const command of allCommands) {
    await ensureCronjobAbsent(api, command);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the cron jobs running ${allCommands.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allCommands.map((command): [string, () => Promise<void>] => [
    `remove the cron job running "${command}"`, () => ensureCronjobAbsent(api, command),
  ]));
});

test('an admin adds a cron job, and the appliance really has one', async ({ page, api }) => {
  const description = 'Created from the card';

  await openAddCronForm(page);
  await page.locator(cronLocators.form.description).fill(description);
  await page.locator(cronLocators.form.command).fill(createdCommand);
  await chooseCronUser(page, user);
  // Ticked by default, so a stored `stdout: false` can only have come from this click.
  await page.locator(cronLocators.form.hideStdout).click();
  await saveCronForm(page);

  await expect(page.locator(cronLocators.card.description(createdCommand, user))).toHaveText(description);

  expect(await findCronjob(api, createdCommand)).toMatchObject({
    command: createdCommand,
    description,
    user,
    stdout: false,
    // Untouched in the form, so they have to come back out as its defaults.
    stderr: false,
    enabled: true,
    schedule: daily,
  });
});

test('editing a cron job from the card changes the job that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findCronjob(api, targetCommand);
  const editedDescription = 'Edited from the card';

  await openEditCronForm(page, targetCommand, user);
  await page.locator(cronLocators.form.description).fill(editedDescription);
  await page.locator(cronLocators.form.command).fill(editedCommand);
  await chooseCronSchedule(page, hourlyScheduleLabel);
  await page.locator(cronLocators.form.enabled).click();
  await saveCronForm(page);

  // The row is looked up under its new command, because the card builds every
  // id on it from the command — and the old one must be gone, or the save made
  // a second job rather than changing the first.
  await expect(page.locator(cronLocators.card.description(editedCommand, user))).toHaveText(editedDescription);
  await expect(page.locator(cronLocators.card.enabled(editedCommand, user))).toHaveText('No');
  await expect(page.locator(cronLocators.card.row(targetCommand, user))).toBeHidden();

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findCronjob(api, targetCommand)).toBeUndefined();
  expect(await findCronjob(api, editedCommand)).toMatchObject({
    id: before?.id,
    command: editedCommand,
    description: editedDescription,
    schedule: hourly,
    enabled: false,
    // Untouched in the form, so they have to come back out the way they went in.
    user,
    stdout: true,
    stderr: false,
  });

  expect(await findCronjob(api, bystanderCommand)).toMatchObject({
    description: bystanderDescription,
    schedule: monthly,
    enabled: true,
  });
});

test('running a cron job from the card runs the job that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const target = await findCronjob(api, targetCommand);
  const bystander = await findCronjob(api, bystanderCommand);
  if (!target || !bystander) {
    throw new Error('the cron jobs seeded over the API are not there to run');
  }

  // Middleware remembers finished jobs, and a cron job's id can be reused after
  // a delete, so only a run that was not there before counts as this test's.
  const targetRunsBefore = new Set((await findCronRuns(api, target.id)).map((run) => run.id));
  const bystanderRunsBefore = (await findCronRuns(api, bystander.id)).length;

  const reported = await runCronJob(page, targetCommand, user);
  expect(reported).toContain(targetDescription);

  await expect.poll(
    async () => (await findCronRuns(api, target.id))
      .filter((run) => !targetRunsBefore.has(run.id))
      .map((run) => run.state),
    { timeout: 60_000, message: 'a new cronjob.run job for the target should finish with SUCCESS' },
  ).toEqual(['SUCCESS']);

  expect(await findCronRuns(api, bystander.id)).toHaveLength(bystanderRunsBefore);
});

test('deleting a cron job from the card removes the job that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteCronJob(page, targetCommand, user);

  await expect(page.locator(cronLocators.card.row(targetCommand, user))).toBeHidden();
  expect(await findCronjob(api, targetCommand)).toBeUndefined();

  // The whole point of the second job: the card looks right either way.
  await expect(page.locator(cronLocators.card.row(bystanderCommand, user))).toBeVisible();
  expect(await findCronjob(api, bystanderCommand)).toBeDefined();
});
