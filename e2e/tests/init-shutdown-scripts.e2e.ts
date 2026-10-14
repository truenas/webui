/**
 * Stories: an admin adds, edits and deletes an init/shutdown script from the
 * card on System > Advanced Settings, and the appliance holds what they did.
 *
 * Each save is asserted twice, the way the share specs do it: the card's row
 * says the screen believed it, `initshutdownscript.query` says the appliance did
 * it — and carries what the card shows differently or not at all, like the
 * timeout and the raw When value.
 *
 * Edit and delete each run beside a second script that must come through
 * untouched: the row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug changes the wrong
 * script without failing anything else.
 *
 * Every command is a harmless `echo`. An enabled script really runs at the
 * appliance's next boot or shutdown, and a run that dies before its teardown
 * leaves one there.
 */
import {
  ensureInitShutdownScriptAbsent, ensureInitShutdownScriptPresent, findInitShutdownScript,
} from '../fixtures/init-shutdown';
import {
  chooseInitShutdownWhen,
  confirmInitShutdownDeletion,
  openAddInitShutdownForm,
  openDeleteInitShutdownDialog,
  openEditInitShutdownForm,
  saveInitShutdownForm,
} from '../flows/init-shutdown';
import { initShutdownLocators } from '../locators/init-shutdown';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const createdCommand = 'echo e2e-init-shutdown-created';

/** Provisioned over the API so there is something to edit or delete. */
const targetCommand = 'echo e2e-init-shutdown-target';
const targetDescription = 'Target script';

/** What the edit test changes the target's command to. */
const editedCommand = 'echo e2e-init-shutdown-edited';

/** The script that must survive whatever is done to the target. */
const bystanderCommand = 'echo e2e-init-shutdown-bystander';
const bystanderDescription = 'Bystander script';

const allCommands = [createdCommand, targetCommand, editedCommand, bystanderCommand];

/** Both scripts over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureInitShutdownScriptPresent(api, {
    command: targetCommand, when: 'PREINIT', comment: targetDescription,
  });
  await ensureInitShutdownScriptPresent(api, {
    command: bystanderCommand, when: 'PREINIT', comment: bystanderDescription,
  });
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const command of allCommands) {
    await ensureInitShutdownScriptAbsent(api, command);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the init/shutdown scripts running ${allCommands.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allCommands.map((command): [string, () => Promise<void>] => [
    `remove the script running "${command}"`, () => ensureInitShutdownScriptAbsent(api, command),
  ]));
});

test('an admin adds a command script, and the appliance really has one', async ({ page, api }) => {
  const description = 'Created from the card';

  await openAddInitShutdownForm(page);
  await page.locator(initShutdownLocators.form.comment).fill(description);
  await page.locator(initShutdownLocators.form.command).fill(createdCommand);
  await chooseInitShutdownWhen(page, 'POSTINIT');
  // Not the default of 10, so a stored 15 can only have come from this field.
  await page.locator(initShutdownLocators.form.timeout).fill('15');
  await saveInitShutdownForm(page);

  await expect(page.locator(initShutdownLocators.card.description(createdCommand, 'POSTINIT')))
    .toHaveText(description);

  expect(await findInitShutdownScript(api, createdCommand)).toMatchObject({
    type: 'COMMAND',
    command: createdCommand,
    comment: description,
    when: 'POSTINIT',
    enabled: true,
    timeout: 15,
  });
});

test('editing a script from the card changes the script that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findInitShutdownScript(api, targetCommand);
  const editedDescription = 'Edited from the card';

  await openEditInitShutdownForm(page, targetCommand, 'PREINIT');
  await page.locator(initShutdownLocators.form.comment).fill(editedDescription);
  await page.locator(initShutdownLocators.form.command).fill(editedCommand);
  await chooseInitShutdownWhen(page, 'SHUTDOWN');
  await saveInitShutdownForm(page);

  // The row is looked up under its new values, because the card builds every
  // id on it from the command and the When — and the old one must be gone, or
  // the save made a second script rather than changing the first.
  await expect(page.locator(initShutdownLocators.card.description(editedCommand, 'SHUTDOWN')))
    .toHaveText(editedDescription);
  await expect(page.locator(initShutdownLocators.card.row(targetCommand, 'PREINIT'))).toBeHidden();

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findInitShutdownScript(api, targetCommand)).toBeUndefined();
  expect(await findInitShutdownScript(api, editedCommand)).toMatchObject({
    id: before?.id,
    command: editedCommand,
    comment: editedDescription,
    when: 'SHUTDOWN',
    // Untouched in the form, so they have to come back out the way they went in.
    type: 'COMMAND',
    enabled: true,
    timeout: 10,
  });

  expect(await findInitShutdownScript(api, bystanderCommand)).toMatchObject({
    comment: bystanderDescription,
    when: 'PREINIT',
  });
});

test('deleting a script from the card removes the script that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await openDeleteInitShutdownDialog(page, targetCommand, 'PREINIT');
  await confirmInitShutdownDeletion(page);

  await expect(page.locator(initShutdownLocators.card.row(targetCommand, 'PREINIT'))).toBeHidden();
  expect(await findInitShutdownScript(api, targetCommand)).toBeUndefined();

  // The whole point of the second script: the card looks right either way.
  await expect(page.locator(initShutdownLocators.card.row(bystanderCommand, 'PREINIT'))).toBeVisible();
  expect(await findInitShutdownScript(api, bystanderCommand)).toBeDefined();
});
