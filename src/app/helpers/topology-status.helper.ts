import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { VDevItem } from 'app/interfaces/storage.interface';

interface StatusVisual {
  severity: number;
  themeClass: string;
}

// Single source of truth for ordering and theming of `TopologyItemStatus` values used in
// per-VDEV/disk tree views. It deliberately does NOT cover `PoolStatus`-level concerns
// (pool cards, dashboard widgets) — pool-level UIs treat values like REMOVED as fatal,
// while at the VDEV level REMOVED means a single disk was pulled.
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
 * Returns the worst (highest-severity) status reached by walking `item` and its descendants,
 * so a parent VDEV reporting ONLINE still surfaces a faulted/degraded child.
 */
export function getEffectiveStatus(item: VDevItem | undefined): TopologyItemStatus | undefined {
  if (!item) {
    return undefined;
  }
  let worst = item.status;
  for (const child of item.children ?? []) {
    const childWorst = getEffectiveStatus(child);
    if (childWorst && getStatusSeverity(childWorst) > getStatusSeverity(worst)) {
      worst = childWorst;
    }
  }
  return worst;
}
