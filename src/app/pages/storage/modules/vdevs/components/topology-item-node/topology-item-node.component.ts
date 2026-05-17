import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Disk } from 'app/interfaces/disk.interface';
import {
  TopologyDisk, VDevItem,
} from 'app/interfaces/storage.interface';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/vdevs/components/topology-item-icon/topology-item-icon.component';

@Component({
  selector: 'ix-topology-item-node',
  templateUrl: './topology-item-node.component.html',
  styleUrls: ['./topology-item-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopologyItemIconComponent, NgClass],
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

  // Surface the worst descendant status when a parent VDEV would otherwise
  // hide a faulted/degraded child behind its own ONLINE status.
  protected readonly effectiveStatus = computed<TopologyItemStatus | undefined>(() => {
    const own = this.topologyItem()?.status;
    const worstChild = this.worstChildStatus(this.topologyItem());
    if (worstChild && severityScore(worstChild) > severityScore(own)) {
      return worstChild;
    }
    return own;
  });

  protected readonly status = computed(() => {
    return this.effectiveStatus() ?? '';
  });

  protected readonly capacity = computed(() => {
    return this.isDisk() && this.disk()?.size ? buildNormalizedFileSize(this.disk().size) : '';
  });

  protected readonly errors = computed(() => {
    if (this.topologyItem().stats) {
      const stats = this.topologyItem().stats;
      const errors = (stats?.checksum_errors || 0) + (stats?.read_errors || 0) + (stats?.write_errors || 0);
      return this.translate.instant('{n, plural, =0 {No errors} one {# Error} other {# Errors}}', { n: errors });
    }
    return '';
  });

  protected readonly statusClass = computed(() => {
    switch (this.effectiveStatus() as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
      case TopologyItemStatus.Unavail:
        return 'fn-theme-red';
      case PoolStatus.Degraded:
      case PoolStatus.Offline:
      case TopologyItemStatus.Offline:
      case TopologyItemStatus.Removed:
        return 'fn-theme-yellow';
      default:
        return '';
    }
  });

  private readonly isDisk = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Disk && this.topologyItem().path);
  });

  private worstChildStatus(item: VDevItem | undefined): TopologyItemStatus | undefined {
    let worst: TopologyItemStatus | undefined;
    for (const child of item?.children ?? []) {
      const candidates = [child.status, this.worstChildStatus(child)];
      for (const candidate of candidates) {
        if (candidate && (!worst || severityScore(candidate) > severityScore(worst))) {
          worst = candidate;
        }
      }
    }
    return worst;
  }
}

function severityScore(status: TopologyItemStatus | undefined): number {
  switch (status) {
    case TopologyItemStatus.Faulted:
    case TopologyItemStatus.Unavail:
      return 3;
    case TopologyItemStatus.Degraded:
      return 2;
    case TopologyItemStatus.Offline:
    case TopologyItemStatus.Removed:
      return 1;
    default:
      return 0;
  }
}
