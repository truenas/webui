/**
 * The Email card's form, driven through the UI from System > General Settings.
 */
import { expect, type Page } from '@playwright/test';
import { goToGeneralSettings } from './navigation';
import { selectOption } from './storage';
import { emailLocators, type MailSecurity } from '../locators/email';

/** Saving rewrites the mail configuration and nothing more, but give it room. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * The card hands the form the record it loaded, and its Settings button stays
 * disabled until it has one. Waiting for the form's Mail Server Port to show the
 * port the test started from then confirms the panel is editing that record
 * rather than an empty form.
 */
export async function openEmailForm(page: Page, port: number): Promise<void> {
  await goToGeneralSettings(page);
  await expect(page.locator(emailLocators.card.sendMailMethod)).toHaveText('SMTP');

  await page.locator(emailLocators.card.settings).click();
  await expect(page.locator(emailLocators.form.port)).toHaveValue(String(port));
}

/** Picks the Security option in the open form. */
export async function chooseMailSecurity(page: Page, security: MailSecurity): Promise<void> {
  await selectOption(page, emailLocators.form.security, emailLocators.form.securityOption(security));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveEmailForm(page: Page): Promise<void> {
  await page.locator(emailLocators.form.save).click();
  await expect(page.locator(emailLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
