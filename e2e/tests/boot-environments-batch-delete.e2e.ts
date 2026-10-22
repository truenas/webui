/**
 * Stories: an admin ticks several boot environments on System > Boot and deletes
 * them at once from the Batch Operations toolbar, and the running boot
 * environment is never sent for deletion even when it is ticked.
 *
 * Each delete is asserted twice: the dialog and the list say what the screen
 * believed, `boot.environment.query` says what the appliance holds.
 *
 * A third boot environment is cloned beside the two under test and never ticked.
 * The batch sends whatever the selection held, so a selection that picked up an
 * extra row would delete it without failing anything else.
 *
 * Every boot environment made here is a clone of the running one, so none of
 * them is running or set to boot next, and nothing here changes what the
 * appliance boots into. The running one is only ever ticked, never deleted.
 *
 * What the ticket asked as a third story, a kept boot environment reported as not
 * deleted, is not here: `boot.environment.destroy` refuses only the running and
 * the activated boot environment and ignores `keep`, which only tells the updater
 * what it may prune. A kept clone in the batch is deleted like any other.
 */
import {
  ensureBootEnvironmentAbsent,
  ensureBootEnvironmentPresent,
  findBootEnvironment,
  findRunningBootEnvironment,
} from '../fixtures/boot-environments';
import {
  confirmBootEnvironmentDelete,
  openBatchDeleteDialog,
  selectBootEnvironments,
  waitForBootEnvironmentDeleteDialogToClose,
  waitForBootEnvironmentDeleteReport,
} from '../flows/boot-environments';
import { selectRow } from '../flows/table';
import { bootEnvironmentLocators, bootEnvironmentRowTag } from '../locators/boot-environments';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const { batch, deleteDialog, list } = bootEnvironmentLocators;

const firstName = 'e2e-bootenv-batch-a';
const secondName = 'e2e-bootenv-batch-b';

/** Never ticked, and must come through every batch untouched. */
const bystanderName = 'e2e-bootenv-batch-bystander';

const allNames = [firstName, secondName, bystanderName];

/** All three over the API: deleting them from the list is the thing under test. */
async function seedBootEnvironments(api: E2eApiClient): Promise<void> {
  for (const name of allNames) {
    await ensureBootEnvironmentPresent(api, name);
  }
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 * `ensureBootEnvironmentAbsent` clears `keep` first.
 */
test.beforeEach(async ({ api }) => {
  for (const name of allNames) {
    await ensureBootEnvironmentAbsent(api, name);
  }
  await seedBootEnvironments(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the boot environments ${allNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the boot environment ${name}`, () => ensureBootEnvironmentAbsent(api, name),
  ]));
});

test('an admin deletes two ticked boot environments at once, and the one left unticked stays', async ({ page, api }) => {
  await selectBootEnvironments(page, [firstName, secondName]);
  await openBatchDeleteDialog(page);

  await expect(page.locator(deleteDialog.message)).toContainText('The following 2 boot environments will be deleted');
  await expect(page.locator(deleteDialog.item(firstName))).toBeVisible();
  await expect(page.locator(deleteDialog.item(secondName))).toBeVisible();
  await expect(page.locator(deleteDialog.item(bystanderName))).toBeHidden();

  await confirmBootEnvironmentDelete(page);
  await waitForBootEnvironmentDeleteReport(page);

  // Two items, so the dialog stays open with a report rather than closing.
  await expect(page.locator(deleteDialog.succeeded)).toHaveText('2 boot environments have been deleted.');
  await expect(page.locator(deleteDialog.failed)).toBeHidden();

  await page.locator(deleteDialog.close).click();
  await expect(page.locator(deleteDialog.title)).toBeHidden();

  await expect(page.locator(list.row(firstName))).toBeHidden();
  await expect(page.locator(list.row(secondName))).toBeHidden();
  await expect(page.locator(list.row(bystanderName))).toBeVisible();

  // Polled: the job has answered, but the list reload and the query are separate reads.
  await expect.poll(() => findBootEnvironment(api, firstName)).toBeUndefined();
  await expect.poll(() => findBootEnvironment(api, secondName)).toBeUndefined();
  expect(await findBootEnvironment(api, bystanderName)).toBeDefined();
});

test('the running boot environment is dropped from a batch delete even when it is ticked', async ({ page, api }) => {
  const running = await findRunningBootEnvironment(api);

  await selectBootEnvironments(page, [running.id]);
  // A selection of nothing but the running boot environment has nothing to delete.
  await expect(page.locator(batch.delete)).toBeDisabled();

  await selectRow(page, bootEnvironmentRowTag(firstName));
  await expect(page.locator(batch.delete)).toBeEnabled();
  await openBatchDeleteDialog(page);

  await expect(page.locator(deleteDialog.message)).toContainText('The following boot environment will be deleted');
  await expect(page.locator(deleteDialog.item(firstName))).toBeVisible();
  await expect(page.locator(deleteDialog.item(running.id))).toBeHidden();

  // One item that succeeds closes the dialog by itself, with no report.
  await confirmBootEnvironmentDelete(page);
  await waitForBootEnvironmentDeleteDialogToClose(page);

  await expect.poll(() => findBootEnvironment(api, firstName)).toBeUndefined();
  expect(await findBootEnvironment(api, running.id)).toMatchObject({
    active: true,
    activated: running.activated,
  });
  expect(await findBootEnvironment(api, bystanderName)).toBeDefined();
});
