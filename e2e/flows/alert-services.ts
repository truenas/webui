/**
 * Alert services, driven through the UI from System > Alert Settings.
 *
 * The page raises no first-time warning in front of the form, so nothing here
 * waits for one.
 */
import { expect, type Page } from '@playwright/test';
import { goToAlertSettings } from './navigation';
import { selectOption } from './storage';
import { alertServiceLocators } from '../locators/alert-services';
import { confirmDialogLocators } from '../locators/dialogs';
import { apiCallsTo } from '../support/api-calls';
import { slowCallTimeoutMs } from '../support/timeouts';

/** Creating, updating and deleting a service are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add form from the list, starting from the sidebar. */
export async function openAddAlertServiceForm(page: Page): Promise<void> {
  await goToAlertSettings(page);

  await page.locator(alertServiceLocators.list.add).click();
  await expect(page.locator(alertServiceLocators.form.name)).toBeVisible();
}

/**
 * Picks Slack as the type in the open form, and waits for its Webhook URL
 * field — the type swaps the whole Settings section, so that field existing is
 * what says the swap happened.
 */
export async function chooseSlackType(page: Page): Promise<void> {
  const { form } = alertServiceLocators;
  await selectOption(page, form.type, form.typeSlack);
  await expect(page.locator(form.slackUrl)).toBeVisible();
}

/**
 * Picks SNMP Trap as the type in the open add form, and waits for its Hostname
 * field — the same swap as {@link chooseSlackType}.
 */
export async function chooseSnmpTrapType(page: Page): Promise<void> {
  const { form } = alertServiceLocators;
  await selectOption(page, form.type, form.typeSnmpTrap);
  await expect(page.locator(form.snmpHost)).toBeVisible();
}

/** Picks a level by its label — `Critical`, `Error` — in the open form. */
export async function chooseAlertLevel(page: Page, label: string): Promise<void> {
  const { form } = alertServiceLocators;
  await selectOption(page, form.level, form.levelOption(label));
}

/** Opens a service's edit form from its row and waits until `field` holds the stored `value`. */
async function openEditForm(page: Page, name: string, field: string, value: string): Promise<void> {
  await goToAlertSettings(page);

  await page.locator(alertServiceLocators.list.edit(name)).click();
  await expect(page.locator(alertServiceLocators.form.name)).toHaveValue(name);
  await expect(page.locator(field)).toHaveValue(value);
}

/**
 * Opens the edit form for a Slack service from its row, starting from the
 * sidebar, and waits until it holds that service's URL.
 *
 * The URL is not just a sign the panel is editing *this* service. The form
 * patches the type's own fields a tick after it opens, so a value typed into
 * the URL before then would be overwritten by the stored one.
 */
export async function openEditAlertServiceForm(page: Page, name: string, url: string): Promise<void> {
  await openEditForm(page, name, alertServiceLocators.form.slackUrl, url);
}

/** {@link openEditAlertServiceForm} for an SNMP Trap service, waiting on its Hostname instead. */
export async function openEditSnmpTrapAlertServiceForm(page: Page, name: string, host: string): Promise<void> {
  await openEditForm(page, name, alertServiceLocators.form.snmpHost, host);
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a
 * refusal leaves it open with the error attached.
 */
export async function saveAlertServiceForm(page: Page): Promise<void> {
  await page.locator(alertServiceLocators.form.save).click();
  await expect(page.locator(alertServiceLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Presses Send Test Alert and waits for middleware's answer to have arrived and
 * the form to have acted on it.
 *
 * `alertservice.test` answers `true` and `false` alike as an ordinary result, and
 * the form reports them differently: a snackbar with no `data-test` for `true`,
 * the warn dialog for `false`. So this waits on the answer itself, which needs
 * `test.use({ recordApiCalls: true })` in the spec, and then on the button coming
 * back, which happens after the form has raised whichever it was. What the
 * caller then asserts on is the dialog — as `verifyCloudCredential` does.
 */
export async function sendTestAlert(page: Page): Promise<void> {
  const method = 'alertservice.test';
  const send = page.locator(alertServiceLocators.form.sendTestAlert);
  const earlier = apiCallsTo(page, method).length;

  await expect(send).toBeEnabled();
  await send.click();

  await expect.poll(
    () => apiCallsTo(page, method).slice(earlier).map((call) => call.answer),
    { timeout: slowCallTimeoutMs },
  ).toEqual(['result']);
  await expect(send).toBeEnabled();
}

/**
 * Closes the form without saving, and waits for it to go.
 *
 * Only for a form that has been edited: the panel then asks whether to discard
 * the changes, and that question is asserted rather than looked for.
 */
export async function discardAlertServiceForm(page: Page): Promise<void> {
  const { form } = alertServiceLocators;
  await page.locator(form.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.name)).toBeHidden();
}

/**
 * Deletes a service from its row, through webui's shared confirm, starting from
 * the sidebar, and waits for its row to go.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled**
 * until the box is ticked — asserted on the way, so a dialog that lost its gate
 * fails here rather than passing a test that never needed it. The list reloads
 * only once the delete has returned, so the row is what is waited on.
 */
export async function deleteAlertService(page: Page, name: string): Promise<void> {
  await goToAlertSettings(page);
  await page.locator(alertServiceLocators.list.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(alertServiceLocators.list.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
