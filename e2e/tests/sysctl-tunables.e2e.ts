/**
 * Stories: an admin adds, edits and deletes a sysctl variable from the Tunable
 * card on System > Advanced Settings, and the appliance holds what they did.
 *
 * Each save is asserted twice, the way the share specs do it: the card's row
 * says the screen believed it, `tunable.query` says the appliance did it — and
 * carries what the card shows differently or not at all, like the type.
 *
 * Edit and delete each run beside a second tunable that must come through
 * untouched: the row's actions sit in a kebab menu, so an action belongs to
 * whichever row's menu was opened, and a row-targeting bug changes the wrong
 * tunable without failing anything else.
 *
 * Every variable is a TCP timer that nothing in a test run depends on, and every
 * value is one below its kernel default. An enabled tunable sets its variable
 * the moment it is saved, and middleware puts the old value back only when the
 * tunable is deleted or disabled, so a run that dies before its teardown leaves
 * one changed until the next run's cleanup.
 */
import { ensureTunableAbsent, ensureTunablePresent, findTunable } from '../fixtures/tunable';
import {
  chooseSysctlType, deleteTunable, openAddTunableForm, openEditTunableForm, saveTunableForm,
} from '../flows/tunable';
import { tunableLocators } from '../locators/tunable';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. Default 9. */
const createdVariable = 'net.ipv4.tcp_keepalive_probes';

/** Provisioned over the API so there is something to edit or delete. Default 75. */
const targetVariable = 'net.ipv4.tcp_keepalive_intvl';
const targetValue = '74';
const targetDescription = 'Target tunable';

/** The tunable that must survive whatever is done to the target. Default 60. */
const bystanderVariable = 'net.ipv4.tcp_fin_timeout';
const bystanderValue = '59';
const bystanderDescription = 'Bystander tunable';

const allVariables = [createdVariable, targetVariable, bystanderVariable];

/** Both tunables over the API: acting on one from the card is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureTunablePresent(api, { variable: targetVariable, value: targetValue, comment: targetDescription });
  await ensureTunablePresent(api, {
    variable: bystanderVariable, value: bystanderValue, comment: bystanderDescription,
  });
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const variable of allVariables) {
    await ensureTunableAbsent(api, variable);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the tunables for ${allVariables.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allVariables.map((variable): [string, () => Promise<void>] => [
    `remove the tunable for ${variable}`, () => ensureTunableAbsent(api, variable),
  ]));
});

test('an admin adds a sysctl variable, and the appliance really has it', async ({ page, api }) => {
  const description = 'Created from the card';

  await openAddTunableForm(page);
  await chooseSysctlType(page);
  await page.locator(tunableLocators.form.variable).fill(createdVariable);
  await page.locator(tunableLocators.form.value).fill('8');
  await page.locator(tunableLocators.form.comment).fill(description);
  await saveTunableForm(page);

  await expect(page.locator(tunableLocators.card.value(createdVariable))).toHaveText('8');
  await expect(page.locator(tunableLocators.card.description(createdVariable))).toHaveText(description);

  expect(await findTunable(api, createdVariable)).toMatchObject({
    type: 'SYSCTL',
    var: createdVariable,
    value: '8',
    comment: description,
    // Untouched in the form, so it has to come back out as its default.
    enabled: true,
  });
});

test('editing a tunable from the card changes the tunable that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);
  const before = await findTunable(api, targetVariable);
  const editedDescription = 'Edited from the card';

  await openEditTunableForm(page, targetVariable, targetValue);
  await page.locator(tunableLocators.form.value).fill('73');
  await page.locator(tunableLocators.form.comment).fill(editedDescription);
  // Ticked on the seeded tunable, so a stored `enabled: false` can only have come from this click.
  await page.locator(tunableLocators.form.enabled).click();
  await saveTunableForm(page);

  // The row tag is the variable alone, so the row keeps its ids through an edit.
  await expect(page.locator(tunableLocators.card.value(targetVariable))).toHaveText('73');
  await expect(page.locator(tunableLocators.card.description(targetVariable))).toHaveText(editedDescription);
  await expect(page.locator(tunableLocators.card.enabled(targetVariable))).toHaveText('No');

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the card looking the same.
  expect(await findTunable(api, targetVariable)).toMatchObject({
    id: before?.id,
    value: '73',
    comment: editedDescription,
    enabled: false,
    // Disabled in the form on edit, so they have to come back out the way they went in.
    type: 'SYSCTL',
    var: targetVariable,
  });

  expect(await findTunable(api, bystanderVariable)).toMatchObject({
    value: bystanderValue,
    comment: bystanderDescription,
    enabled: true,
  });
});

test('deleting a tunable from the card removes the tunable that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteTunable(page, targetVariable);

  // Polled rather than read once: the card reloads after the job, but a row can
  // also be hidden while the table is between loads, which proves nothing.
  await expect.poll(() => findTunable(api, targetVariable)).toBeUndefined();

  // The whole point of the second tunable: the card looks right either way.
  await expect(page.locator(tunableLocators.card.row(bystanderVariable))).toBeVisible();
  expect(await findTunable(api, bystanderVariable)).toMatchObject({ value: bystanderValue });
});
