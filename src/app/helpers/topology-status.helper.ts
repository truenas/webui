import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { VDevItem } from 'app/interfaces/storage.interface';

interface StatusVisual {
  severity: number;
  themeClass: string;
}

// Single source of truth for ordering and theming of TopologyItemStatus values.
// Add new statuses here so every consumer (icons, cards, summaries) stays in sync.
const statusVisuals = new Map<TopologyItemStatus, StatusVisual>([
  [TopologyItemStatus.Faulted, { severity: 3, themeClass: 'fn-theme-red' }],
  [TopologyItemStatus.Unavail, { severity: 3, themeClass: 'fn-theme-red' }],
  [TopologyItemStatus.Degraded, { severity: 2, themeClass: 'fn-theme-yellow' }],
  [TopologyItemStatus.Offline, { severity: 1, themeClass: 'fn-theme-yellow' }],
  [TopologyItemStatus.Removed, { severity: 1, themeClass: 'fn-theme-yellow' }],
]);

export function getStatusSeverity(status: TopologyItemStatus | undefined): number {
  return status ? (statusVisuals.get(status)?.severity ?? 0) : 0;
}

export function getStatusThemeClass(status: TopologyItemStatus | undefined): string {
  return status ? (statusVisuals.get(status)?.themeClass ?? '') : '';
}

/**
 * Walks the tree below `item` and returns the worst (highest-severity) status found.
 * Returns undefined when there are no children with a comparable status.
 */
export function worstDescendantStatus(item: VDevItem | undefined): TopologyItemStatus | undefined {
  let worst: TopologyItemStatus | undefined;
  for (const child of item?.children ?? []) {
    const candidates = [child.status, worstDescendantStatus(child)];
    for (const candidate of candidates) {
      if (candidate && getStatusSeverity(candidate) > getStatusSeverity(worst)) {
        worst = candidate;
      }
    }
  }
  return worst;
}

/**
 * Returns the higher-severity status between `item.status` and the worst status of its descendants,
 * so a parent VDEV reporting ONLINE still surfaces a faulted/degraded child.
 */
export function getEffectiveStatus(item: VDevItem | undefined): TopologyItemStatus | undefined {
  const own = item?.status;
  const worstChild = worstDescendantStatus(item);
  return getStatusSeverity(worstChild) > getStatusSeverity(own) ? worstChild : own;
}
