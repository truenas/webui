import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { VDevItem } from 'app/interfaces/storage.interface';

export const criticalSeverity = 3;

// Online and Inuse (a spare actively replacing a failed drive) intentionally fall through to 0
// — neither is a fault that warrants surfacing on a parent row.
export function statusSeverity(status: TopologyItemStatus | undefined): number {
  switch (status) {
    case TopologyItemStatus.Faulted:
    case TopologyItemStatus.Unavail:
      return criticalSeverity;
    case TopologyItemStatus.Degraded:
      return 2;
    case TopologyItemStatus.Offline:
    case TopologyItemStatus.Removed:
      return 1;
    default:
      return 0;
  }
}

export interface DescendantWarning {
  count: number;
  worst: TopologyItemStatus | undefined;
}

// Walks `item`'s descendants (not `item` itself) to find the worst-status leaf and the
// total count of non-optimal leaves. Used both for the inline warning icon on a collapsed
// parent row and for deciding whether to auto-expand that row.
export function collectDescendantWarning(item: VDevItem): DescendantWarning {
  let count = 0;
  let worst: TopologyItemStatus | undefined;
  let worstSev = 0;
  for (const child of item.children ?? []) {
    const childSev = child.status ? statusSeverity(child.status) : 0;
    if (childSev > 0) {
      count += 1;
      if (childSev > worstSev) {
        worst = child.status;
        worstSev = childSev;
      }
    }
    const fromChild = collectDescendantWarning(child);
    count += fromChild.count;
    const fromChildSev = statusSeverity(fromChild.worst);
    if (fromChildSev > worstSev) {
      worst = fromChild.worst;
      worstSev = fromChildSev;
    }
  }
  return { count, worst };
}
