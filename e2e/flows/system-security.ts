/**
 * The System Security card's form, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { systemSecuritySaveTimeoutMs } from '../fixtures/system-security';
import { confirmDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import { systemSecurityLocators } from '../locators/system-security';

/**
 * Opens the form from the card, on Advanced Settings already.
 *
 * Unlike the other cards there, this one raises no first-time warning: `onConfigure` opens the
 * form directly, without `FirstTimeWarningService`.
 *
 * The form fills itself from `system.security.config` after it opens, so a value typed before
 * then could be overwritten by the load. Save is enabled only once that load has finished.
 */
export async function openSystemSecurityForm(page: Page): Promise<void> {
  const { card, form } = systemSecurityLocators;
  await page.locator(card.configure).click();
  await expect(page.locator(form.minPasswordAge)).toBeVisible();
  await expect(page.locator(form.save)).toBeEnabled();
}

/**
 * Clicks each of these rules, by label, in the open form's Password Complexity Ruleset select.
 * A click toggles a rule, so this both picks and drops.
 *
 * The select is multiple, so its panel stays open between clicks. Escape closes it, and would
 * close the side panel too if the select had not taken the key, so Save is asserted still there.
 */
export async function toggleComplexityRules(page: Page, labels: [string, ...string[]]): Promise<void> {
  const { form } = systemSecurityLocators;
  await page.locator(form.complexityRuleset).click();

  for (const label of labels) {
    await page.locator(form.complexityRulesetOption(label)).click();
  }

  await page.keyboard.press('Escape');
  await expect(page.locator(form.complexityRulesetOption(labels[0]))).toBeHidden();
  await expect(page.locator(form.save)).toBeVisible();
}

/**
 * Saves the form and waits for the panel to close — the app's own signal that the
 * `system.security.update` job succeeded. The panel closes only after the "Saving settings" job
 * dialog has, so that dialog is checked gone afterwards rather than raced before it opens.
 */
export async function saveSystemSecurityForm(page: Page): Promise<void> {
  const { form } = systemSecurityLocators;
  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: systemSecuritySaveTimeoutMs });
  await expect(page.locator(jobDialogLocators.title)).toBeHidden();
}

/**
 * Closes the edited form without saving. The form is dirty, so the unsaved-changes question is
 * asserted rather than looked for.
 */
export async function discardSystemSecurityForm(page: Page): Promise<void> {
  const { form } = systemSecurityLocators;
  await page.locator(form.closePanel).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(form.save)).toBeHidden();
}
