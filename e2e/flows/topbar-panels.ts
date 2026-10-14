/**
 * The alerts and jobs panels, opened from the topbar.
 *
 * Neither is a page. Both open over whatever the test is already looking at,
 * which is why these flows start from wherever the test is rather than
 * navigating anywhere.
 */
import { expect, type Page } from '@playwright/test';
import { alertsPanelLocators } from '../locators/alerts-panel';
import { jobsPanelLocators } from '../locators/jobs-panel';
import { topbarLocators } from '../locators/topbar';

/** Opens the alerts panel from the bell. */
export async function openAlertsPanel(page: Page): Promise<void> {
  await page.locator(topbarLocators.alertsIndicator).click();

  await expect(page.locator(alertsPanelLocators.filterAll)).toBeVisible();
}

/** Opens the jobs panel from the clipboard beside the bell. */
export async function openJobsPanel(page: Page): Promise<void> {
  await page.locator(topbarLocators.jobsIndicator).click();

  await expect(page.locator(jobsPanelLocators.runningCount)).toBeVisible();
}
