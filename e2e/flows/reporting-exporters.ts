/**
 * Reporting exporters, driven through the UI from Reporting > Exporters.
 *
 * The sidebar has no entry for the exporters list: it is reached from the Exporters button in the
 * Reporting page's header.
 */
import { expect, type Page } from '@playwright/test';
import { goToReporting } from './navigation';
import { confirmDestructiveAction, selectOption } from './storage';
import type { GraphiteDestination } from '../fixtures/reporting-exporters';
import { reportingExportersLocators } from '../locators/reporting-exporters';
import { slowCallTimeoutMs } from '../support/timeouts';

const { list, form } = reportingExportersLocators;

/** Opens the exporters list from the sidebar, through the Reporting page's Exporters button. */
export async function openReportingExporters(page: Page): Promise<void> {
  await goToReporting(page);
  await page.locator(reportingExportersLocators.openExporters).click();
  await expect(page).toHaveURL(/\/reportsdashboard\/exporters\/?$/);
}

/** Opens the add form from the list, starting from the sidebar. */
export async function openAddExporterForm(page: Page): Promise<void> {
  await openReportingExporters(page);
  await page.locator(list.add).click();
  await expect(page.locator(form.name)).toBeVisible();
}

/**
 * Picks Graphite as the type in the open form, and waits for its Destination IP field: the
 * attribute controls of a type are shown only once it is selected.
 */
export async function chooseGraphiteType(page: Page): Promise<void> {
  await selectOption(page, form.type, form.typeGraphite);
  await expect(page.locator(form.destinationIp)).toBeVisible();
}

/** Fills Graphite's three required attributes in the open form, and nothing else. */
export async function fillGraphiteDestination(page: Page, destination: GraphiteDestination): Promise<void> {
  await page.locator(form.destinationIp).fill(destination.destinationIp);
  await page.locator(form.destinationPort).fill(String(destination.destinationPort));
  await page.locator(form.namespace).fill(destination.namespace);
}

/**
 * Opens the edit form for an exporter from its row, starting from the sidebar, and waits until it
 * holds that exporter's destination.
 *
 * The form patches the record only once the exporter schemas have loaded, so a value typed before
 * then would be overwritten by the stored one.
 */
export async function openEditExporterForm(page: Page, name: string, destinationIp: string): Promise<void> {
  await openReportingExporters(page);
  await page.locator(list.edit(name)).click();
  await expect(page.locator(form.name)).toHaveValue(name);
  await expect(page.locator(form.destinationIp)).toHaveValue(destinationIp);
}

/**
 * Saves the form and waits for the panel to close, which is the app's own signal that middleware
 * stored the exporter. A refusal leaves it open with the error attached.
 */
export async function saveExporterForm(page: Page): Promise<void> {
  const save = page.locator(form.save);

  await expect(save).toBeEnabled();
  await save.click();
  // A ceiling: every save waits for middleware to restart netdata.
  await expect(save).toBeHidden({ timeout: slowCallTimeoutMs });
}

/**
 * Deletes an exporter from its row, through the shared confirm with its tick box, starting from the
 * sidebar, and waits for its row to go. The list reloads only once the delete has returned.
 */
export async function deleteExporter(page: Page, name: string): Promise<void> {
  await openReportingExporters(page);
  await page.locator(list.delete(name)).click();
  await confirmDestructiveAction(page);
  await expect(page.locator(list.row(name))).toBeHidden({ timeout: slowCallTimeoutMs });
}
