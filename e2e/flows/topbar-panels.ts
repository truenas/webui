/**
 * The alerts and jobs panels, opened from the topbar.
 *
 * Neither is a page. Both open over whatever the test is already looking at,
 * which is why these flows start from wherever the test is rather than
 * navigating anywhere. The Jobs page is here too, because the jobs panel is the
 * only way a user reaches it.
 */
import { expect, type Page } from '@playwright/test';
import { alertsPanelLocators } from '../locators/alerts-panel';
import { jobsPageLocators } from '../locators/jobs';
import { jobsPanelLocators } from '../locators/jobs-panel';
import { topbarLocators } from '../locators/topbar';

/** Opens the alerts panel from the bell. */
export async function openAlertsPanel(page: Page): Promise<void> {
  await page.locator(topbarLocators.alertsIndicator).click();

  await expect(page.locator(alertsPanelLocators.filterAll)).toBeVisible();
}

/**
 * Opens the jobs panel from the clipboard beside the bell, and waits for its
 * jobs to load: the header renders before they have, and a job started in that
 * gap never reaches the panel.
 */
export async function openJobsPanel(page: Page): Promise<void> {
  await page.locator(topbarLocators.jobsIndicator).click();

  await expect(page.locator(jobsPanelLocators.runningCount)).toBeVisible();
  await expect(page.locator(jobsPanelLocators.finishedList)).toBeAttached();
}

/**
 * Opens the Jobs page the way a user reaches it, from the jobs panel's "View
 * All Jobs". The page has no sidebar entry. Waits for the page's filter, and for
 * the panel to have closed behind it.
 *
 * The caller opens the panel first with {@link openJobsPanel}, and does so
 * before starting any job the page should list: the page reads the same job
 * store, and a job started before the store subscribed is never in it.
 */
export async function openJobsPage(page: Page): Promise<void> {
  await page.locator(jobsPanelLocators.viewAllJobs).click();

  await expect(page).toHaveURL(/\/jobs(\?|$)/);
  await expect(page.locator(jobsPageLocators.filter.all)).toBeVisible();
  await expect(page.locator(jobsPanelLocators.runningCount)).toBeHidden();
}
