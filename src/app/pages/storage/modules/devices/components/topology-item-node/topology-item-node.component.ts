import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Disk } from 'app/interfaces/disk.interface';
import {
  TopologyDisk, TopologyItem,
} from 'app/interfaces/storage.interface';
import { TopologyItemIconComponent } from 'app/pages/storage/modules/devices/components/topology-item-icon/topology-item-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-topology-item-node',
  templateUrl: './topology-item-node.component.html',
  styleUrls: ['./topology-item-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TopologyItemIconComponent, NgClass],
})
export class TopologyItemNodeComponent {
  readonly topologyItem = input.required<TopologyItem>();
  readonly disk = input.required<Disk>();

  constructor(
    protected translate: TranslateService,
  ) {}

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

  protected readonly errors = computed(() => {
    if (this.topologyItem().stats) {
      const stats = this.topologyItem().stats;
      const errors = (stats?.checksum_errors || 0) + (stats?.read_errors || 0) + (stats?.write_errors || 0);
      return this.translate.instant('{n, plural, =0 {No errors} one {# Error} other {# Errors}}', { n: errors });
    }
    return '';
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

  private readonly isDisk = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Disk && this.topologyItem().path);
  });
}
