/**
 * What the full task lists under Data Protection share: the page header's
 * search box, and how a row's detail panel names its actions.
 *
 * Each list's own rows and actions are in that task's module, under `list`,
 * because each list builds its row ids from different fields.
 */
import { legacyKebabTestSegment } from './test-id';

export const taskListLocators = {
  /**
   * `ix-basic-search`, a `tn-input` with `[testId]="'search'"`. Every list
   * filters on columns its own component names.
   */
  search: '[data-test="input-search"]',
} as const;

/**
 * An action in a list row's detail panel, revealed by clicking the row.
 *
 * `detailActionTestId(parts, action)` is lodash `kebabCase` of the parts and the
 * action joined by hyphens, so `run_now` comes out as `run-now`. Each list picks
 * its own parts: the task's id for replication and cloud sync, its dataset and
 * naming schema for a periodic snapshot task.
 */
export function taskListDetailAction(parts: (string | number)[], action: string): string {
  return `[data-test="button-${legacyKebabTestSegment([...parts, action].join('-'))}"]`;
}
