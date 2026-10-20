/**
 * One report on the Reporting page, and the page's own header controls.
 *
 * Every id on a report is keyed by its title as middleware names the graph in
 * `reporting.netdata_graphs` (`CPU Usage`), through the library normalizer. The title is what
 * `report.component.html` passes, untranslated, so the ids do not change with the UI language.
 */
import { kebabTestSegment } from './test-id';

export const reportingLocators = {
  /** The Category select in the page header: `<tn-select testId="category">`, one option per tab. */
  category: '[data-test="select-category"]',
  /** A tab in the Category select, keyed by its label (`Memory`, `ZFS`). */
  categoryOption: (label: string): string => `[data-test="option-category-${kebabTestSegment(label)}"]`,
  /** The Devices picker in the page header, rendered on the Disk tab and no other. */
  devices: '[data-test="select-devices"]',
  /** A disk in the Devices picker, keyed by its `devname` (`sda`), which is also its label. */
  deviceOption: (devname: string): string => `[data-test="option-devices-${kebabTestSegment(devname)}"]`,
  /** The Metrics picker beside Devices, one option per disk graph. */
  metrics: '[data-test="select-metrics"]',
  /** A metric in the Metrics picker, keyed by its label (`Disk I/O`). */
  metricOption: (label: string): string => `[data-test="option-metrics-${kebabTestSegment(label)}"]`,
  /** Every option the Metrics picker offers but the one labelled `label`, whatever the appliance collects. */
  metricOptionsOtherThan: (label: string): string => (
    `[data-test^="option-metrics-"]:not([data-test="option-metrics-${kebabTestSegment(label)}"])`
  ),
  /** The heading of every report on the Disk tab, Disk I/O and Disk Temperature alike. */
  diskReportTitles: '[data-test^="text-disk-"][data-test$="-title"]',
  /**
   * The report's card: `[tnTestId]="[report().title, 'report']"` with `tnTestIdType="card"`. The step
   * and zoom buttons below carry the same id on every report, so they are only addressable inside this.
   */
  card: (title: string): string => `[data-test="card-${kebabTestSegment(title)}-report"]`,
  /** The report's heading: `[tnTestId]="[report().title, 'title']"` with `tnTestIdType="text"`. */
  title: (title: string): string => `[data-test="text-${kebabTestSegment(title)}-title"]`,
  /** The start and end of the shown period, as `ix-date`s beside the chart. */
  start: (title: string): string => `[data-test="date-${kebabTestSegment(title)}-start"]`,
  end: (title: string): string => `[data-test="date-${kebabTestSegment(title)}-end"]`,
  /** The legend table under the chart, one row per series. */
  legend: (title: string): string => `[data-test="table-reports-table-${kebabTestSegment(title)}"]`,
  /**
   * Every series' average over the shown period, in the legend's Mean column:
   * `[report().title, legendItem, 'mean']`. Matched on both ends, because the series names in the
   * middle come from middleware and the app renames and reorders them per graph.
   */
  means: (title: string): string => `[data-test^="text-${kebabTestSegment(title)}-"][data-test$="-mean"]`,
  /** Unkeyed: the same ids on every report, so select them inside {@link reportingLocators.card}. */
  stepBack: '[data-test="button-steps-back"]',
  stepForward: '[data-test="button-steps-forward"]',
  zoomIn: '[data-test="button-zoom-in"]',
  zoomOut: '[data-test="button-zoom-out"]',
  zoomReset: '[data-test="button-zoom-reset"]',
} as const;
