import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Disk } from 'app/interfaces/disk.interface';
import {
  TopologyDisk, VDevItem,
} from 'app/interfaces/storage.interface';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-icon/topology-item-icon.component';

const criticalSeverity = 3;

@Component({
  selector: 'ix-topology-item-node',
  templateUrl: './topology-item-node.component.html',
  styleUrls: ['./topology-item-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopologyItemIconComponent, NgClass, TnIconComponent, MatTooltip],
})
export class TopologyItemNodeComponent {
  protected translate = inject(TranslateService);

  readonly topologyItem = input.required<VDevItem>();
  readonly disk = input.required<Disk>();

  protected readonly name = computed(() => {
    if ((this.topologyItem() as TopologyDisk).disk) {
      return (this.topologyItem() as TopologyDisk).disk;
    }
    if (this.isDisk()) {
      return this.topologyItem().guid;
    }
    return this.topologyItem().type;
  });

  protected readonly status = computed(() => {
    return this.topologyItem()?.status ? this.topologyItem().status : '';
  });

  protected readonly capacity = computed(() => {
    return this.isDisk() && this.disk()?.size ? buildNormalizedFileSize(this.disk().size) : '';
  });

  private readonly errorCount = computed(() => {
    const stats = this.topologyItem().stats;
    if (!stats) return null;
    return (stats.checksum_errors || 0) + (stats.read_errors || 0) + (stats.write_errors || 0);
  });

  protected readonly errors = computed(() => {
    const count = this.errorCount();
    if (count === null) return '';
    return this.translate.instant('{n, plural, =0 {No errors} one {# Error} other {# Errors}}', { n: count });
  });

  protected readonly errorsClass = computed(() => {
    return (this.errorCount() ?? 0) > 0 ? 'fn-theme-red' : '';
  });

  protected readonly statusClass = computed(() => {
    switch (this.topologyItem().status as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
        return 'fn-theme-red';
      case PoolStatus.Degraded:
      case PoolStatus.Offline:
      case TopologyItemStatus.Offline:
        return 'fn-theme-yellow';
      default:
        return '';
    }
  });

  // Worst-severity status reached by walking this item's descendants (not the item itself).
  // Drives the warning icon next to the VDEV name on collapsed parent rows so a failing
  // child disk doesn't get hidden behind a DEGRADED parent badge in the tree view.
  // The parent's own `status` text/badge stays exactly as reported by `pool.query` /
  // `zpool status` — this is purely a visual scannability hint.
  private readonly worstDescendantSeverity = computed(() => {
    return computeWorstDescendantSeverity(this.topologyItem());
  });

  protected readonly hasDescendantWarning = computed(() => this.worstDescendantSeverity() > 0);

  protected readonly descendantWarningClass = computed(() => {
    return this.worstDescendantSeverity() >= criticalSeverity ? 'severity-critical' : 'severity-warning';
  });

  protected readonly descendantWarningTooltip = computed(() => {
    return this.translate.instant('A disk inside this VDEV is not optimal. Expand to see details.');
  });

  private readonly isDisk = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Disk && this.topologyItem().path);
  });
}

function statusSeverity(status: TopologyItemStatus | undefined): number {
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

function computeWorstDescendantSeverity(item: VDevItem): number {
  let worst = 0;
  for (const child of item.children ?? []) {
    worst = Math.max(worst, statusSeverity(child.status), computeWorstDescendantSeverity(child));
  }
  return worst;
}
