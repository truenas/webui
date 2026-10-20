/**
 * Story: an admin moves through the Reporting tabs from the Category select, narrows the Disk tab to
 * one disk and one metric, and steps and zooms a report through time.
 *
 * `reporting.e2e.ts` covers the CPU tab; this file covers Memory, Network, Disk, ZFS and System. UPS
 * is left out because the CI guest has no UPS, and the tab is not even offered without one.
 *
 * Report titles are read from `reporting.netdata_graphs` rather than written here, because they are
 * middleware's and every id on a report is keyed by one. Each tab is checked by one graph only that
 * tab draws: `memory`, `interface`, `disk`, `arcsize` (the only ZFS graph webui and middleware both
 * name) and `uptime`. A tab of per-identifier reports (a NIC, a disk) lists them sorted by identifier
 * in a virtual scroll that renders only the first few, so those take the first identifier.
 *
 * "Charts a report" means a Mean in its legend holds a number, as in `reporting.e2e.ts`. Any series
 * rather than the first: the template writes `null` for a Mean of zero, and an interface's or a
 * disk's first series can be idle for the whole hour.
 *
 * The step and zoom buttons carry the same ids on every report, so they are selected inside the
 * report's card, which is keyed by its title. They are checked on the CPU tab's `cpu` report, which
 * every appliance draws, by reading the Start and End shown beside the chart. A report opens on the
 * last hour. Zoom In is disabled there and Reset Zoom has nothing to reset, so the zoom test zooms out
 * twice first.
 *
 * Auto Refresh would move the shown period back to the present every few seconds, so the step and
 * zoom tests require it off, which is webui's default. Nothing is created, so there is no teardown.
 */
import type { Page } from '@playwright/test';
import { listBootDisks } from '../fixtures/boot-environments';
import { listDisks } from '../fixtures/disks';
import { readPreference } from '../fixtures/preferences';
import {
  findFirstGraphIdentifier, findGraphIdentifiers, findGraphTitle, findGraphTitleFor,
} from '../fixtures/reporting';
import { goToReporting } from '../flows/navigation';
import {
  chooseReportingCategory, readReportRange, reportControl, toggleOptions,
} from '../flows/reporting';
import { reportingLocators } from '../locators/reporting';
import type { E2eApiClient } from '../support/api/client';
import { expect, test } from '../support/fixtures';

/** A report waits a second before it fetches, then fetches its hour of samples. */
const reportLoadTimeoutMs = 30_000;

/** The period a report opens on, and the one Reset Zoom returns to. */
const oneHourMs = 60 * 60_000;

/** The Disk tab's Devices and Metrics pickers apply a change after a 300 ms debounce. */
const diskPickerTimeoutMs = 10_000;

/** The Metrics picker's label for the `disk` graph: its title with `({identifier})` removed. */
const diskIoMetric = 'Disk I/O';

interface ReportTab {
  label: string;
  route: RegExp;
  /** A graph that only this tab draws. */
  graph: string;
  /** Whether the graph draws one report per identifier. */
  perIdentifier: boolean;
}

const tabs: ReportTab[] = [
  {
    label: 'Memory', route: /\/reportsdashboard\/memory$/, graph: 'memory', perIdentifier: false,
  },
  {
    label: 'Network', route: /\/reportsdashboard\/network$/, graph: 'interface', perIdentifier: true,
  },
  {
    label: 'Disk', route: /\/reportsdashboard\/disk$/, graph: 'disk', perIdentifier: true,
  },
  {
    label: 'ZFS', route: /\/reportsdashboard\/zfs$/, graph: 'arcsize', perIdentifier: false,
  },
  {
    label: 'System', route: /\/reportsdashboard\/system$/, graph: 'uptime', perIdentifier: false,
  },
];

/** The title of the first report `tab` draws for its graph. */
async function findFirstReportTitle(api: E2eApiClient, tab: ReportTab): Promise<string> {
  let title: string | undefined;
  if (tab.perIdentifier) {
    const identifier = await findFirstGraphIdentifier(api, tab.graph, await findGraphIdentifiers(api, tab.graph));
    title = identifier ? await findGraphTitleFor(api, tab.graph, identifier) : undefined;
  } else {
    title = await findGraphTitle(api, tab.graph);
  }

  if (!title) {
    throw new Error(`reporting.netdata_graphs offers no "${tab.graph}" report, so the ${tab.label} tab has nothing to draw.`);
  }

  return title;
}

/** Waits for the report titled `title` to draw, then for a Mean in its legend to hold a number. */
async function expectChartedData(page: Page, title: string): Promise<void> {
  await expect(page.locator(reportingLocators.title(title))).toBeVisible({ timeout: reportLoadTimeoutMs });

  const means = page.locator(reportingLocators.legend(title)).locator(reportingLocators.means(title));
  await expect(means.first()).toBeVisible({ timeout: reportLoadTimeoutMs });
  await expect(means.filter({ hasText: /\d/ }).first()).toBeVisible();
}

/** The `cpu` report's title, which the step and zoom tests drive. */
async function requireCpuTitle(api: E2eApiClient): Promise<string> {
  // A precondition rather than a setting this file writes: the toggle is a preference on the
  // account the whole suite signs in as, and nothing in the suite turns it on.
  if (await readPreference(api, 'autoRefreshReports')) {
    throw new Error('Auto Refresh is on for this account, so a report keeps returning to the present.');
  }

  const title = await findGraphTitle(api, 'cpu');
  if (!title) {
    throw new Error('reporting.netdata_graphs offers no "cpu" graph, so the CPU tab has nothing to draw.');
  }

  return title;
}

for (const tab of tabs) {
  test(`the ${tab.label} tab, opened from the Category select, charts real data`, async ({ page, api }) => {
    const title = await findFirstReportTitle(api, tab);

    await goToReporting(page);
    await chooseReportingCategory(page, tab.label, tab.route);

    await expectChartedData(page, title);
  });
}

test('narrowing the Disk tab to one disk and one metric leaves only that report', async ({ page, api }) => {
  // The boot disk, because it is the one disk certain to have been written to in the last hour.
  const [bootDisk] = await listBootDisks(api);
  if (!bootDisk) {
    throw new Error('boot.get_disks lists no disk.');
  }

  const identifiers = (await findGraphIdentifiers(api, 'disk')).sort((a, b) => a.localeCompare(b));
  // `<name> | Type: … | Model: … | Serial: …`, and the Devices picker matches on `<name>`.
  const deviceOf = (identifier: string): string => identifier.split(' | ')[0] ?? identifier;
  const bootIdentifier = identifiers.find((identifier) => deviceOf(identifier) === bootDisk);
  // The first other disk in the tab's order, so its report is one the tab renders before narrowing.
  const otherIdentifier = identifiers.find((identifier) => deviceOf(identifier) !== bootDisk);
  if (!bootIdentifier || !otherIdentifier) {
    throw new Error(`reporting.netdata_graphs draws disk I/O for ${identifiers.length} disk(s); this needs the boot disk and one more.`);
  }
  const bootTitle = await findGraphTitleFor(api, 'disk', bootIdentifier);
  const otherTitle = await findGraphTitleFor(api, 'disk', otherIdentifier);
  if (!bootTitle || !otherTitle) {
    throw new Error('reporting.netdata_graphs has no disk I/O title for the disks it lists.');
  }

  // Every disk the picker offers except the boot disk: the picker starts with all of them chosen.
  const otherDevices = (await listDisks(api))
    .map((disk) => disk.devname)
    .filter((devname) => !devname.includes('multipath') && devname !== bootDisk);

  await goToReporting(page);
  await chooseReportingCategory(page, 'Disk', /\/reportsdashboard\/disk$/);

  // The other disk's report is on screen first, so its absence afterwards is the picker's doing
  // rather than the virtual scroll's.
  await expect(page.locator(reportingLocators.title(otherTitle))).toBeVisible({ timeout: reportLoadTimeoutMs });

  await toggleOptions(page, reportingLocators.devices, otherDevices.map(reportingLocators.deviceOption));

  // Metrics starts with every disk graph chosen too. The CI guest reports no disk temperature, so
  // Disk I/O is usually the only one and this drops nothing; on hardware it drops the rest.
  await page.locator(reportingLocators.metrics).click();
  await expect(page.locator(reportingLocators.metricOption(diskIoMetric))).toBeVisible();
  for (const option of await page.locator(reportingLocators.metricOptionsOtherThan(diskIoMetric)).all()) {
    await option.click();
  }
  await page.keyboard.press('Escape');

  await expect(page.locator(reportingLocators.title(otherTitle))).toBeHidden({ timeout: diskPickerTimeoutMs });
  // Every disk report left on the page is the boot disk's Disk I/O.
  await expect(page.locator(reportingLocators.diskReportTitles)).toHaveCount(1);
  await expectChartedData(page, bootTitle);
});

test('zooming a report in narrows its period, and Reset Zoom restores the last hour', async ({ page, api }) => {
  const title = await requireCpuTitle(api);

  await goToReporting(page);
  await expectChartedData(page, title);

  const opened = await readReportRange(page, title);
  expect(opened.end - opened.start).toBe(oneHourMs);

  // Out twice, to a week, so that In has somewhere to go and still leaves the period wider than the
  // hour Reset returns to.
  await reportControl(page, title, reportingLocators.zoomOut).click();
  await reportControl(page, title, reportingLocators.zoomOut).click();
  await expect.poll(async () => {
    const range = await readReportRange(page, title);
    return range.end - range.start;
  }).toBeGreaterThan(24 * oneHourMs);
  const zoomedOut = await readReportRange(page, title);

  await reportControl(page, title, reportingLocators.zoomIn).click();
  await expect.poll(async () => {
    const range = await readReportRange(page, title);
    return range.end - range.start;
  }).toBeLessThan(zoomedOut.end - zoomedOut.start);
  const zoomedIn = await readReportRange(page, title);
  expect(zoomedIn.end - zoomedIn.start).toBeGreaterThan(oneHourMs);

  await reportControl(page, title, reportingLocators.zoomReset).click();
  await expect.poll(async () => {
    const range = await readReportRange(page, title);
    return range.end - range.start;
  }).toBe(oneHourMs);
  expect((await readReportRange(page, title)).end).toBeGreaterThanOrEqual(opened.end);
});

test('Step Back moves a report one period earlier, and Step Forward brings it back', async ({ page, api }) => {
  const title = await requireCpuTitle(api);

  await goToReporting(page);
  await expectChartedData(page, title);

  const opened = await readReportRange(page, title);
  // A report opens on the present, which there is nothing after.
  await expect(reportControl(page, title, reportingLocators.stepForward)).toBeDisabled();

  await reportControl(page, title, reportingLocators.stepBack).click();
  await expect.poll(() => readReportRange(page, title)).toEqual({
    start: opened.start - oneHourMs,
    end: opened.start,
  });

  await reportControl(page, title, reportingLocators.stepForward).click();
  await expect.poll(() => readReportRange(page, title)).toEqual(opened);
});
