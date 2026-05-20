import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { TopologyDisk, VDevItem, VDevItemEnriched } from 'app/interfaces/storage.interface';

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
 * Returns a deep copy of `item` where every node carries an `effectiveStatus` reflecting
 * the worst (highest-severity) status reached by walking that node and its descendants,
 * so a parent VDEV reporting ONLINE still surfaces a faulted/degraded child. The cast is
 * isolated here so callers can treat the result as a fully enriched tree without their
 * own casts.
 */
export function enrichWithEffectiveStatus(item: VDevItem): VDevItemEnriched {
  const enrichedChildren = (item.children ?? []).map(enrichWithEffectiveStatus);
  const effectiveStatus = enrichedChildren.reduce<TopologyItemStatus | undefined>(
    (worst, child) => (getStatusSeverity(child.effectiveStatus) > getStatusSeverity(worst)
      ? child.effectiveStatus
      : worst),
    item.status,
  );
  return { ...item, children: enrichedChildren as TopologyDisk[], effectiveStatus };
}
