/**
 * One report on the Reporting page, and the page's own header controls.
 *
 * Every id on a report is keyed by its title as middleware names the graph in
 * `reporting.netdata_graphs` (`CPU Usage`), through the library normalizer. The title is what
 * `report.component.html` passes, untranslated, so the ids do not change with the UI language.
 */
import { kebabTestSegment } from './test-id';

export const reportingLocators = {
  /** The Devices picker in the page header, rendered on the Disk tab and no other. */
  devices: '[data-test="select-devices"]',
  /** The report's heading: `[tnTestId]="[report().title, 'title']"` with `tnTestIdType="text"`. */
  title: (title: string): string => `[data-test="text-${kebabTestSegment(title)}-title"]`,
  /** The legend table under the chart, one row per series. */
  legend: (title: string): string => `[data-test="table-reports-table-${kebabTestSegment(title)}"]`,
  /**
   * Every series' average over the shown period, in the legend's Mean column:
   * `[report().title, legendItem, 'mean']`. Matched on both ends, because the series names in the
   * middle come from middleware and the app renames and reorders them per graph.
   */
  means: (title: string): string => `[data-test^="text-${kebabTestSegment(title)}-"][data-test$="-mean"]`,
} as const;
