/**
 * Audit settings, driven through the UI from System > Advanced Settings, and the
 * Audit page's Service selector, search box and Export.
 */
import { expect, type Download, type Page } from '@playwright/test';
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

/** `audit.export` runs as a job and writes the report, then `core.download` serves it. */
const exportTimeoutMs = 120_000;

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

/** Picks a service by its label in the Audit page's Service selector, which reloads the log for it. */
export async function chooseAuditService(page: Page, label: string): Promise<void> {
  const option = page.locator(auditLocators.search.serviceOption(label));

  await page.locator(auditLocators.search.service).click();
  await option.click();
  await expect(option).toBeHidden();
}

/** Types `term` into the basic search box and runs it with Search. */
export async function runBasicAuditSearch(page: Page, term: string): Promise<void> {
  await page.locator(auditLocators.search.basic).fill(term);
  await page.locator(auditLocators.search.run).click();
}

/**
 * Switches the search box to advanced mode and types `query` into the editor, without running it.
 *
 * Typed key by key, because the editor is CodeMirror rather than an input and `fill` cannot reach
 * it. CodeMirror closes a quote as it is opened and steps over the closer when it is typed, so a
 * query typed in full arrives as written.
 */
export async function typeAdvancedAuditQuery(page: Page, query: string): Promise<void> {
  await page.locator(auditLocators.search.switchToAdvanced).click();
  await page.locator(auditLocators.search.advanced).click();
  await page.keyboard.type(query);
}

/**
 * Picks `format` in the menu beside Export, clicks Export, and returns the file the browser
 * receives: a gzipped tar holding the report, whatever the format.
 */
export async function exportAuditLog(page: Page, format: 'CSV' | 'JSON'): Promise<Download> {
  const exportButton = page.locator(auditLocators.exporting.exportButton);

  await page.locator(auditLocators.exporting.formatMenu).click();
  await page.locator(auditLocators.exporting.format(format)).click();
  await expect(exportButton).toContainText(`Export As ${format}`);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: exportTimeoutMs }),
    exportButton.click(),
  ]);

  return download;
}
