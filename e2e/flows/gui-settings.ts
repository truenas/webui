/**
 * The GUI card's Settings form on System > General Settings, driven through the UI.
 *
 * Nothing here confirms the Restart Web Service prompt. Confirming it calls
 * `system.general.ui_restart`, which cuts the suite's UI off in CI.
 */
import { expect, type Page } from '@playwright/test';
import { confirmDialogLocators } from '../locators/dialogs';
import { generalSettingsLocators } from '../locators/general-settings';

/** `system.general.update` restarts middleware's `ssl` service before it answers. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card on the open General Settings page.
 *
 * The form fills itself from the store's general config, and HTTPS Protocols is
 * required, so a protocol showing in it is the sign the values have arrived.
 */
export async function openGuiForm(page: Page): Promise<void> {
  await page.locator(generalSettingsLocators.gui.settings).click();
  await expect(page.locator(generalSettingsLocators.guiForm.httpsProtocols)).toContainText('TLSv1');
}

/**
 * Ticks or unticks each of these protocols in the open form's HTTPS Protocols,
 * then closes the list with Escape.
 *
 * Escape is what a person uses to leave a multiple select. It would close the
 * side panel too if the select had not taken the key, so Save is asserted still
 * there afterwards.
 */
export async function toggleHttpsProtocols(page: Page, protocols: [string, ...string[]]): Promise<void> {
  const form = generalSettingsLocators.guiForm;
  await page.locator(form.httpsProtocols).click();

  for (const protocol of protocols) {
    await page.locator(form.httpsProtocolOption(protocol)).click();
  }

  await page.keyboard.press('Escape');
  await expect(page.locator(form.httpsProtocolOption(protocols[0]))).toBeHidden();
  await expect(page.locator(form.save)).toBeVisible();
}

/** Picks a GUI SSL Certificate in the open form by its name. */
export async function chooseGuiCertificate(page: Page, name: string): Promise<void> {
  const form = generalSettingsLocators.guiForm;
  await page.locator(form.certificate).click();
  await page.locator(form.certificateOption(name)).click();
  await expect(page.locator(form.certificate)).toContainText(name);
}

/**
 * Opens one of the open form's selects, reads the labels of every option it
 * offers, and closes it again with Escape without choosing anything.
 *
 * `options` must match only that select's options. The options are read in one
 * go once the first has rendered.
 */
export async function listGuiSelectOptions(page: Page, select: string, options: string): Promise<string[]> {
  await page.locator(select).click();
  const offered = page.locator(options);
  await expect(offered.first()).toBeVisible();
  const labels = (await offered.allInnerTexts()).map((label) => label.trim());

  await page.keyboard.press('Escape');
  await expect(offered.first()).toBeHidden();
  await expect(page.locator(generalSettingsLocators.guiForm.save)).toBeVisible();

  return labels;
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached. Any Restart Web Service prompt comes
 * after this, and is the caller's to answer.
 */
export async function saveGuiForm(page: Page): Promise<void> {
  const { save } = generalSettingsLocators.guiForm;
  await page.locator(save).click();
  await expect(page.locator(save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Dismisses the open side panel, for a form left unedited, which closes without asking. */
export async function closeGuiForm(page: Page): Promise<void> {
  const form = generalSettingsLocators.guiForm;
  await page.locator(form.closePanel).click();
  await expect(page.locator(form.save)).toBeHidden();
}

/** Closes the panel without saving. It has been edited, so the panel asks first. */
export async function discardGuiForm(page: Page): Promise<void> {
  const form = generalSettingsLocators.guiForm;
  await page.locator(form.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.save)).toBeHidden();
}
