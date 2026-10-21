/**
 * The KMIP page's form, driven through the UI from Credentials > KMIP.
 */
import { expect, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { kmipSaveTimeoutMs } from '../fixtures/kmip';
import { kmipLocators } from '../locators/kmip';

/**
 * Waits for the page to finish loading `kmip.config`, which fills the form.
 *
 * Save is disabled only while that load runs, so its turning enabled is the
 * page's own signal that the fields hold the stored values.
 */
export async function waitForKmipPage(page: Page): Promise<void> {
  await expect(page.locator(kmipLocators.form.save)).toBeEnabled({ timeout: kmipSaveTimeoutMs });
}

export async function pickKmipCertificate(page: Page, name: string): Promise<void> {
  await selectOption(page, kmipLocators.form.certificate, kmipLocators.form.certificateOption(name));
  await expect(page.locator(kmipLocators.form.certificate)).toContainText(name);
}
