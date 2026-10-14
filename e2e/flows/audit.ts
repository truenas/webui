/**
 * Audit settings, driven through the UI from System > Advanced Settings.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings } from './navigation';
import { auditLocators } from '../locators/audit';

/** What the form's five fields are filled with. Retention in days, reservation and quota in GiB, the rest in %. */
export interface AuditFormValues {
  retention: number;
  reservation: number;
  quota: number;
  quota_fill_warning: number;
  quota_fill_critical: number;
}

/** Saving writes the reservation and quota to the audit dataset. */
const saveTimeoutMs = 60_000;

/**
 * Opens the form from the card, starting from the sidebar.
 *
 * Waits first for the card to show the retention the test expects to start
 * from, then for the form to load that same value. The form reads
 * `audit.config` itself after it opens, and a field filled before that lands
 * would be overwritten by it.
 */
export async function openAuditForm(page: Page, currentRetention: number): Promise<void> {
  await goToAdvancedSettings(page);
  await expect(page.locator(auditLocators.card.retention)).toHaveText(`${currentRetention} days`);

  await page.locator(auditLocators.card.configure).click();
  await closeFirstTimeWarning(page);
  await expect(page.locator(auditLocators.form.retention)).toHaveValue(String(currentRetention));
}

/** Fills every field of the open form. */
export async function fillAuditForm(page: Page, settings: AuditFormValues): Promise<void> {
  await page.locator(auditLocators.form.retention).fill(String(settings.retention));
  await page.locator(auditLocators.form.reservation).fill(String(settings.reservation));
  await page.locator(auditLocators.form.quota).fill(String(settings.quota));
  await page.locator(auditLocators.form.quotaFillWarning).fill(String(settings.quota_fill_warning));
  await page.locator(auditLocators.form.quotaFillCritical).fill(String(settings.quota_fill_critical));
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded. A refusal
 * leaves it open with the error attached.
 */
export async function saveAuditForm(page: Page): Promise<void> {
  await page.locator(auditLocators.form.save).click();
  await expect(page.locator(auditLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}
