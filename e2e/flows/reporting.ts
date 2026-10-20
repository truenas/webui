/**
 * Driving the Reporting page's header controls and reading a report's shown period.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { reportingLocators } from '../locators/reporting';

/** The page reads `reporting.netdata_graphs` before it renders the Category select. */
const headerLoadTimeoutMs = 30_000;

/**
 * Opens the tab labelled `label` from the Category select and waits for its route.
 *
 * Each tab is its own route (`/reportsdashboard/<value>`), and the select navigates on change.
 */
export async function chooseReportingCategory(page: Page, label: string, route: RegExp): Promise<void> {
  const select = page.locator(reportingLocators.category);
  await expect(select).toBeVisible({ timeout: headerLoadTimeoutMs });
  await select.click();
  await page.locator(reportingLocators.categoryOption(label)).click();
  await expect(page).toHaveURL(route);
}

/**
 * Clicks each option in an open multiple select, then closes it.
 *
 * A click toggles an option, so this both picks and drops. The panel stays open between clicks, and
 * Escape closes it.
 */
export async function toggleOptions(page: Page, select: string, options: string[]): Promise<void> {
  await page.locator(select).click();
  for (const option of options) {
    await page.locator(option).click();
  }
  await page.keyboard.press('Escape');
}

/** A report's step and zoom button, selected inside that report's card. */
export function reportControl(page: Page, title: string, control: string): Locator {
  return page.locator(reportingLocators.card(title)).locator(control);
}

/** The shown period of a report, in milliseconds since the epoch. */
export interface ReportRange {
  start: number;
  end: number;
}

/**
 * Reads one `ix-date` beside the chart as milliseconds.
 *
 * The text is `yyyy-MM-dd HH:mm:ss`, webui's default date and time format, in the appliance's
 * timezone. It is read as though it were UTC, which shifts every reading by the same offset, so the
 * differences these specs compare are unaffected.
 */
async function readReportDate(locator: Locator): Promise<number> {
  const text = (await locator.textContent())?.trim() ?? '';
  if (!/^\d+-\d+-\d+ \d+:\d+:\d+$/.test(text)) {
    throw new Error(`"${text}" is not a yyyy-MM-dd HH:mm:ss date; the account's date or time format is not webui's default.`);
  }

  return Date.parse(`${text.replace(' ', 'T')}Z`);
}

/** The start and end the report shows beside its chart. */
export async function readReportRange(page: Page, title: string): Promise<ReportRange> {
  return {
    start: await readReportDate(page.locator(reportingLocators.start(title))),
    end: await readReportDate(page.locator(reportingLocators.end(title))),
  };
}
