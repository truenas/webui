/**
 * Stories: the full Init/Shutdown Scripts list, reached from the title of the
 * card on System > Advanced Settings.
 *
 * The list has no search. What it shows differently is the Type and the
 * Command/Script columns, and a row tag keyed by the command and the type
 * rather than the When — so editing the When leaves the row where it was. Its
 * Edit opens the card's form with no first-time warning in front of it.
 */
import {
  ensureInitShutdownScriptAbsent, ensureInitShutdownScriptPresent, findInitShutdownScript,
} from '../fixtures/init-shutdown';
import { openAdvancedSettingsList } from '../flows/advanced-settings';
import { chooseInitShutdownWhen, saveInitShutdownForm } from '../flows/init-shutdown';
import { infoDialogLocators } from '../locators/dialogs';
import { initShutdownLocators } from '../locators/init-shutdown';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

const targetCommand = 'echo e2e-init-page-target';
const targetDescription = 'Init page target';
const editedDescription = 'Edited from the page';

const bystanderCommand = 'echo e2e-init-page-bystander';
const bystanderDescription = 'Init page bystander';

const allCommands = [targetCommand, bystanderCommand];

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
    `remove the init/shutdown script running "${command}"`, () => ensureInitShutdownScriptAbsent(api, command),
  ]));
});

test('the Init/Shutdown Scripts card title opens the full list, where Edit changes the script that was picked', async ({
  page,
  api,
}) => {
  await ensureInitShutdownScriptPresent(api, { command: targetCommand, when: 'POSTINIT', comment: targetDescription });
  await ensureInitShutdownScriptPresent(api, {
    command: bystanderCommand, when: 'POSTINIT', comment: bystanderDescription,
  });
  const before = await findInitShutdownScript(api, targetCommand);
  if (!before) {
    throw new Error('the init/shutdown script seeded over the API is not there to edit');
  }

  const { list, form } = initShutdownLocators;
  await openAdvancedSettingsList(page, {
    link: initShutdownLocators.card.title,
    route: /\/system\/initshutdown\/?$/,
    arrived: list.add,
  });

  await expect(page.locator(list.row(bystanderCommand))).toBeVisible();
  // The two columns the card does not have.
  await expect(page.locator(list.type(targetCommand))).toHaveText('Command');
  await expect(page.locator(list.script(targetCommand))).toHaveText(targetCommand);

  await page.locator(list.rowMenu(targetCommand)).click();
  await page.locator(list.rowMenuEdit(targetCommand)).click();

  // The card raises the first-time warning before its form; the page goes straight to the form.
  await expect(page.locator(form.command)).toHaveValue(targetCommand);
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();

  await chooseInitShutdownWhen(page, 'SHUTDOWN');
  await page.locator(form.comment).fill(editedDescription);
  await saveInitShutdownForm(page);

  // The same row id as before the edit, now showing what was saved.
  await expect(page.locator(list.when(targetCommand))).toHaveText('Shutdown');
  await expect(page.locator(list.description(targetCommand))).toHaveText(editedDescription);

  expect(await findInitShutdownScript(api, targetCommand)).toMatchObject({
    id: before.id,
    when: 'SHUTDOWN',
    comment: editedDescription,
  });
  expect(await findInitShutdownScript(api, bystanderCommand)).toMatchObject({
    when: 'POSTINIT',
    comment: bystanderDescription,
  });
});
