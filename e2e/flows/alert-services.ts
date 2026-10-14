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

/** Creating, updating and deleting a service are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add form from the list, starting from the sidebar. */
export async function openAddAlertServiceForm(page: Page): Promise<void> {
  await goToAlertSettings(page);

  await page.locator(alertServiceLocators.list.add).click();
  await expect(page.locator(alertServiceLocators.form.name)).toBeVisible();
}

/**
 * Picks Slack as the type in the open add form, and waits for its Webhook URL
 * field — the type swaps the whole Settings section, so that field existing is
 * what says the swap happened.
 */
export async function chooseSlackType(page: Page): Promise<void> {
  const { form } = alertServiceLocators;
  await selectOption(page, form.type, form.typeSlack);
  await expect(page.locator(form.slackUrl)).toBeVisible();
}

/** Picks a level by its label — `Critical`, `Error` — in the open form. */
export async function chooseAlertLevel(page: Page, label: string): Promise<void> {
  const { form } = alertServiceLocators;
  await selectOption(page, form.level, form.levelOption(label));
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
  await goToAlertSettings(page);

  await page.locator(alertServiceLocators.list.edit(name)).click();
  await expect(page.locator(alertServiceLocators.form.name)).toHaveValue(name);
  await expect(page.locator(alertServiceLocators.form.slackUrl)).toHaveValue(url);
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
