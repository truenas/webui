/**
 * Stories: the full Cron Jobs list, reached from the title of the card on
 * System > Advanced Settings.
 *
 * The list is a different page from the card: its own search, a row tag built
 * from the command and the description, and Edit in a detail row rather than a
 * kebab menu, with no first-time warning in front of the form. The card's specs
 * say nothing about any of it.
 *
 * The search filters the Users column alone, so the target runs as a user of
 * its own and the bystander as root. Typing a command or a description narrows
 * nothing, and that is pinned here as it is.
 */
import { ensureCronjobAbsent, ensureCronjobPresent, findCronjob, type CronSchedule } from '../fixtures/cron';
import { ensureUserAbsent, ensureUserPresent } from '../fixtures/users';
import { openAdvancedSettingsList } from '../flows/advanced-settings';
import { saveCronForm } from '../flows/cron';
import { expandTaskListRow, searchTaskList } from '../flows/data-protection';
import { cronLocators } from '../locators/cron';
import { infoDialogLocators } from '../locators/dialogs';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The user the target runs as, and what the search looks for. */
const cronUser = 'e2ecronpage';

const targetCommand = 'echo e2e-cron-page-target';
const targetDescription = 'Cron page target';
const editedDescription = 'Edited from the page';

/** Runs as root, so the search for {@link cronUser} has to hide it. */
const bystanderCommand = 'echo e2e-cron-page-bystander';
const bystanderDescription = 'Cron page bystander';

const allCommands = [targetCommand, bystanderCommand];

/** The first of every month, so neither job is likely to run during the test. */
const monthly: CronSchedule = {
  minute: '0', hour: '0', dom: '1', month: '*', dow: '*',
};

/** The jobs before the user: a job cannot outlive the user it runs as. */
async function removeEverything(api: E2eApiClient): Promise<void> {
  await runCleanupSteps([
    ...allCommands.map((command): [string, () => Promise<void>] => [
      `remove the cron job running "${command}"`, () => ensureCronjobAbsent(api, command),
    ]),
    [`remove the user ${cronUser}`, () => ensureUserAbsent(api, cronUser)],
  ]);
}

test.beforeEach(async ({ api }) => {
  await removeEverything(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the cron jobs running ${allCommands.join(', ')} and user ${cronUser}`)) {
    return;
  }

  await removeEverything(api);
});

test('the Cron Jobs card title opens the full list, where search narrows by user and Edit changes the job that was picked', async ({
  page,
  api,
}) => {
  await ensureUserPresent(api, cronUser);
  await ensureCronjobPresent(api, {
    command: targetCommand, description: targetDescription, schedule: monthly, user: cronUser,
  });
  await ensureCronjobPresent(api, { command: bystanderCommand, description: bystanderDescription, schedule: monthly });
  const target = await findCronjob(api, targetCommand);
  if (!target) {
    throw new Error('the cron job seeded over the API is not there to edit');
  }

  const { list, form } = cronLocators;
  await openAdvancedSettingsList(page, {
    link: cronLocators.card.title,
    route: /\/system\/cron\/?$/,
    arrived: list.add,
  });

  await expect(page.locator(list.row(targetCommand, targetDescription))).toBeVisible();
  await expect(page.locator(list.row(bystanderCommand, bystanderDescription))).toBeVisible();

  await searchTaskList(page, cronUser);
  await expect(page.locator(list.row(targetCommand, targetDescription))).toBeVisible();
  await expect(page.locator(list.row(bystanderCommand, bystanderDescription))).toBeHidden();

  await expandTaskListRow(page, list.command(targetCommand, targetDescription), list.edit(target.id));
  await page.locator(list.edit(target.id)).click();

  // The card raises the first-time warning before its form; the page goes straight to the form.
  await expect(page.locator(form.command)).toHaveValue(targetCommand);
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();

  await page.locator(form.description).fill(editedDescription);
  await saveCronForm(page);

  // The row tag carries the description, so the edited row is looked up again under it.
  await expect(page.locator(list.description(targetCommand, editedDescription))).toHaveText(editedDescription);
  await expect(page.locator(list.row(targetCommand, targetDescription))).toBeHidden();

  // The same record, by id: an update, not a delete and a create.
  expect(await findCronjob(api, targetCommand)).toMatchObject({
    id: target.id,
    description: editedDescription,
    user: cronUser,
  });
  expect(await findCronjob(api, bystanderCommand)).toMatchObject({
    description: bystanderDescription,
    user: 'root',
  });
});
