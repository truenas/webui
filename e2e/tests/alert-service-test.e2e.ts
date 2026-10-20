/**
 * Stories: an admin presses Send Test Alert on the alert service form, on an
 * unsaved service and on an edited one, and learns whether it was delivered —
 * and the press saves nothing.
 *
 * Send Test Alert calls `alertservice.test` with the form's current values, never
 * `alertservice.create` or `.update`. Middleware's `test` builds the service from
 * those values, sends one test alert and answers `true`, or answers `false` if
 * sending raised anything at all — it catches every exception and logs it, so an
 * unreachable endpoint is a `false`, not an error (`plugins/alert/alertservice.py`).
 * The form shows a snackbar with no `data-test` for `true` and the warn dialog
 * for `false`, so the dialog is what each test reads.
 *
 * Nothing outside the appliance is contacted:
 * - **Success** is an SNMP v2c trap to `127.0.0.1:162`. To a loopback host the
 *   SNMP Trap service sends nothing unless the local SNMP service is running, and
 *   it logs a failed send rather than raising (`alert/service/snmp_trap.py`), so
 *   `test` answers `true` whether or not anything listens.
 * - **Failure** is a Slack webhook at `127.0.0.1:1`, where nothing listens. The
 *   POST is refused at once, `requests` raises, and `test` answers `false`.
 *
 * Both were read from middleware's source rather than tried against the CI
 * appliance, which this was written without. If the appliance disagrees, the
 * first dialog assertion of the scenario says which way.
 *
 * The edit test seeds an SNMP Trap service and tests it as Slack. Testing a
 * stored Slack service would prove nothing: its URL, under `example.com`, fails
 * to deliver just as the edited one does, so both would raise the same dialog.
 * The stored SNMP values answer `true`, so the warn dialog can only come from
 * the form's values.
 *
 * Middleware does not hold alert service names unique, and `test` checks only the
 * level, so testing under an existing service's name is accepted.
 */
import {
  countAlertServices, ensureAlertServiceAbsent, ensureSnmpTrapAlertServicePresent, findAlertService, findAlertServices,
} from '../fixtures/alert-services';
import {
  chooseSlackType, chooseSnmpTrapType, discardAlertServiceForm, openAddAlertServiceForm,
  openEditSnmpTrapAlertServiceForm, sendTestAlert,
} from '../flows/alert-services';
import { alertServiceLocators } from '../locators/alert-services';
import { errorDialogLocators, infoDialogLocators } from '../locators/dialogs';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** The answer to `alertservice.test` is the only thing to wait on — see `sendTestAlert`. */
test.use({ recordApiCalls: true });

/** Tested over SNMP and never saved. */
const snmpName = 'e2e-alert-test-snmp';

/** Tested against the unreachable webhook and never saved. */
const undeliverableName = 'e2e-alert-test-undeliverable';

/** Seeded over the API so the edit form has something to open. Never tested as stored. */
const seeded = { name: 'e2e-alert-test-seeded', host: '127.0.0.1' };

/** Filled in while the button is gated, and never sent or saved. */
const gateName = 'e2e-alert-test-gate';

/** Port 1 on the loopback: nothing listens, so the POST is refused at once. */
const unreachableUrl = 'http://127.0.0.1:1/e2e-test-alert';

const allNames = [snmpName, undeliverableName, seeded.name, gateName];

/**
 * Removed before each test as well as after, so an interrupted run leaves the
 * next one able to start, and unconditionally so a failure still cleans up.
 * Removal is by name, so it also takes a service a broken Send Test Alert saved.
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

test('Send Test Alert on a new SNMP Trap service reports success, and saves nothing', async ({ page, api }) => {
  const { form } = alertServiceLocators;
  const before = await countAlertServices(api);

  await openAddAlertServiceForm(page);
  await page.locator(form.name).fill(snmpName);
  await chooseSnmpTrapType(page);
  await page.locator(form.snmpHost).fill('127.0.0.1');
  // Left at their defaults, which are what make this a v2c trap to the standard port.
  await expect(page.locator(form.snmpPort)).toHaveValue('162');
  await expect(page.locator(form.snmpCommunity)).toHaveValue('public');

  await sendTestAlert(page);

  // `true` raises only a snackbar with no id, so success is the absence of both
  // dialogs. The test below shows the same wait does see the warn dialog.
  await expect(page.locator(infoDialogLocators.title)).toHaveCount(0);
  await expect(page.locator(errorDialogLocators.title)).toHaveCount(0);
  await expect(page.locator(form.name)).toHaveValue(snmpName);

  await discardAlertServiceForm(page);

  expect(await findAlertService(api, snmpName)).toBeUndefined();
  expect(await countAlertServices(api)).toBe(before);
});

test('a test alert that cannot be delivered is reported as failed, and nothing is saved', async ({ page, api }) => {
  const { form } = alertServiceLocators;

  await openAddAlertServiceForm(page);
  await page.locator(form.name).fill(undeliverableName);
  await chooseSlackType(page);
  await page.locator(form.slackUrl).fill(unreachableUrl);

  await sendTestAlert(page);

  await expect(page.locator(infoDialogLocators.title)).toHaveText('Failed');
  await expect(page.locator(infoDialogLocators.message)).toHaveText('Failed sending test alert!');
  await page.locator(infoDialogLocators.close).click();
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();
  await expect(page.locator(form.name)).toHaveValue(undeliverableName);

  await discardAlertServiceForm(page);

  expect(await findAlertService(api, undeliverableName)).toBeUndefined();
});

test('Send Test Alert on the edit form tests the edited values, and leaves the stored service unchanged', async ({
  page, api,
}) => {
  const { form } = alertServiceLocators;
  await ensureSnmpTrapAlertServicePresent(api, seeded);
  const before = await findAlertService(api, seeded.name);

  await openEditSnmpTrapAlertServiceForm(page, seeded.name, seeded.host);
  await chooseSlackType(page);
  await page.locator(form.slackUrl).fill(unreachableUrl);

  await sendTestAlert(page);

  // The stored SNMP values answer `true` and raise no dialog, so this one says
  // the edited values were the ones tested.
  await expect(page.locator(infoDialogLocators.title)).toHaveText('Failed');
  await expect(page.locator(infoDialogLocators.message)).toHaveText('Failed sending test alert!');
  await page.locator(infoDialogLocators.close).click();
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();

  await discardAlertServiceForm(page);

  const stored = await findAlertServices(api, seeded.name);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    id: before?.id,
    attributes: { type: 'SNMPTrap', host: seeded.host },
  });
});

test('Send Test Alert stays disabled until the form is valid', async ({ page, api }) => {
  const { form } = alertServiceLocators;
  const send = page.locator(form.sendTestAlert);

  await openAddAlertServiceForm(page);
  await chooseSnmpTrapType(page);
  await expect(send).toBeDisabled();

  await page.locator(form.snmpHost).fill('127.0.0.1');
  // Name is required on the common form, so a valid child form alone is not enough.
  await expect(send).toBeDisabled();

  await page.locator(form.name).fill(gateName);
  await expect(send).toBeEnabled();

  await page.locator(form.snmpHost).fill('');
  await expect(send).toBeDisabled();

  expect(apiCallsTo(page, 'alertservice.test')).toEqual([]);

  await discardAlertServiceForm(page);

  // A backstop the ticket asks for: nothing here pressed Send Test Alert or Save.
  expect(await findAlertService(api, gateName)).toBeUndefined();
});
