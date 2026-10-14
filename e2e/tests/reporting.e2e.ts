/**
 * Story: an admin opens Reporting and the CPU tab charts this appliance's CPU usage.
 *
 * Reporting opens on the CPU tab. The spec checks the tab's `cpu` graph, which every appliance
 * collects; the others there (temperature, load, processes) depend on the hardware or say little
 * about whether data arrived. The report's title is read from `reporting.netdata_graphs` rather than
 * written here, because it is middleware's and every id on the report is keyed by it.
 *
 * "Shows live data" means the legend under the chart lists at least one series with a Mean,
 * computed by middleware from the samples it collected over the last hour. A report that failed
 * to load shows an error in place of the chart and has no legend, and one still loading has
 * neither, so a Mean holding a number is the first point at which the page has drawn real data.
 *
 * Nothing is created, so there is no teardown.
 */
import { findGraphTitle } from '../fixtures/reporting';
import { goToReporting } from '../flows/navigation';
import { reportingLocators } from '../locators/reporting';
import { expect, test } from '../support/fixtures';

/** A report waits a second before it fetches, then fetches its hour of samples. */
const reportLoadTimeoutMs = 30_000;

test('an admin opens Reporting, and the CPU report charts real usage', async ({ page, api }) => {
  const cpuTitle = await findGraphTitle(api, 'cpu');
  if (!cpuTitle) {
    throw new Error('reporting.netdata_graphs offers no "cpu" graph, so the CPU tab has nothing to draw.');
  }

  await goToReporting(page);

  await expect(page.locator(reportingLocators.title(cpuTitle))).toBeVisible({ timeout: reportLoadTimeoutMs });

  const means = page.locator(reportingLocators.legend(cpuTitle)).locator(reportingLocators.means(cpuTitle));
  await expect(means.first()).toBeVisible({ timeout: reportLoadTimeoutMs });
  // The template writes `null` for a series with no value, so a digit is what tells a real Mean
  // from a placeholder.
  await expect(means.first()).toHaveText(/\d/);
});
