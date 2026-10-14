/**
 * Stories: an admin adds, edits and deletes an alert service from the Alert
 * Services table on System > Alert Settings, and the appliance holds what they did.
 *
 * Each save is asserted twice: the table's row says the screen believed it,
 * `alertservice.query` says the appliance did it — and carries the webhook URL,
 * which the table does not show.
 *
 * Edit and delete each run beside a second service that must come through
 * untouched. Every row carries its own Edit and Delete buttons, so an action
 * belongs to whichever row's button was clicked, and a row-targeting bug
 * changes the wrong service without failing anything else.
 *
 * Every service is a Slack one pointed at `example.com` — see `fixtures/alert-services.ts`.
 */
import {
  ensureAlertServiceAbsent, ensureSlackAlertServicePresent, findAlertService,
} from '../fixtures/alert-services';
import {
  chooseAlertLevel, chooseSlackType, deleteAlertService, openAddAlertServiceForm, openEditAlertServiceForm,
  saveAlertServiceForm,
} from '../flows/alert-services';
import { alertServiceLocators } from '../locators/alert-services';
import type { E2eApiClient } from '../support/api/client';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Created through the form, never over the API — that is the thing under test. */
const created = { name: 'e2e-alert-service-created', url: 'https://hooks.example.com/e2e/created' };

/** Provisioned over the API so there is something to edit or delete. */
const target = { name: 'e2e-alert-service-target', url: 'https://hooks.example.com/e2e/target' };

/** The service that must survive whatever is done to the target. */
const bystander = { name: 'e2e-alert-service-bystander', url: 'https://hooks.example.com/e2e/bystander' };

const allNames = [created.name, target.name, bystander.name];

/** Both services over the API: acting on one from the table is the thing under test. */
async function seedTargetAndBystander(api: E2eApiClient): Promise<void> {
  await ensureSlackAlertServicePresent(api, target);
  await ensureSlackAlertServicePresent(api, bystander);
}

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 */
test.beforeEach(async ({ api }) => {
  for (const name of allNames) {
    await ensureAlertServiceAbsent(api, name);
  }
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the alert services ${allNames.join(', ')}`)) {
    return;
  }

  await runCleanupSteps(allNames.map((name): [string, () => Promise<void>] => [
    `remove the alert service ${name}`, () => ensureAlertServiceAbsent(api, name),
  ]));
});

test('an admin adds a Slack alert service, and the appliance really has one', async ({ page, api }) => {
  const { list, form } = alertServiceLocators;

  await openAddAlertServiceForm(page);
  await page.locator(form.name).fill(created.name);
  await chooseSlackType(page);
  await chooseAlertLevel(page, 'Critical');
  await page.locator(form.slackUrl).fill(created.url);
  await saveAlertServiceForm(page);

  await expect(page.locator(list.name(created.name))).toHaveText(created.name);
  await expect(page.locator(list.type(created.name))).toHaveText('Slack');
  await expect(page.locator(list.level(created.name))).toHaveText('Critical');
  await expect(page.locator(list.enabled(created.name))).toHaveText('Yes');

  expect(await findAlertService(api, created.name)).toMatchObject({
    name: created.name,
    enabled: true,
    level: 'CRITICAL',
    attributes: { type: 'Slack', url: created.url },
  });
});

test('editing an alert service from its row changes the service that was picked', async ({ page, api }) => {
  const { list, form } = alertServiceLocators;
  await seedTargetAndBystander(api);
  const before = await findAlertService(api, target.name);
  const editedUrl = 'https://hooks.example.com/e2e/edited';

  await openEditAlertServiceForm(page, target.name, target.url);
  // Enabled on the seeded service, so a stored `enabled: false` can only have come from this click.
  await page.locator(form.enabled).click();
  await chooseAlertLevel(page, 'Error');
  await page.locator(form.slackUrl).fill(editedUrl);
  await saveAlertServiceForm(page);

  // The name is the row tag and was left alone, so the row keeps its ids.
  await expect(page.locator(list.level(target.name))).toHaveText('Error');
  await expect(page.locator(list.enabled(target.name))).toHaveText('No');

  // The same record, by id: an update, not a delete and a create that happen to
  // leave the table looking the same.
  expect(await findAlertService(api, target.name)).toMatchObject({
    id: before?.id,
    enabled: false,
    level: 'ERROR',
    attributes: { type: 'Slack', url: editedUrl },
  });

  expect(await findAlertService(api, bystander.name)).toMatchObject({
    enabled: true,
    level: 'WARNING',
    attributes: { type: 'Slack', url: bystander.url },
  });
});

test('deleting an alert service from its row removes the service that was picked', async ({ page, api }) => {
  await seedTargetAndBystander(api);

  await deleteAlertService(page, target.name);

  // Polled rather than read once: a row can also be hidden while the table is
  // between loads, which proves nothing.
  await expect.poll(() => findAlertService(api, target.name)).toBeUndefined();

  // The whole point of the second service: the table looks right either way.
  await expect(page.locator(alertServiceLocators.list.row(bystander.name))).toBeVisible();
  expect(await findAlertService(api, bystander.name)).toMatchObject({
    enabled: true,
    level: 'WARNING',
    attributes: { type: 'Slack', url: bystander.url },
  });
});
