/**
 * Story: an admin opens Reporting and the CPU tab charts this appliance's CPU usage via its `cpu` graph, whose
 * title is read from `reporting.netdata_graphs` because every id on the report is keyed by it. "Live data" means
 * the legend's first Mean holds a number: a failed report has no legend and a loading one has neither, so that's
 * the first point real data is drawn. Nothing is created, so there is no teardown.
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
