import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import {
  Disk, TopologyDisk, TopologyItem,
} from 'app/interfaces/storage.interface';

@UntilDestroy()
@Component({
  selector: 'ix-topology-item-node',
  templateUrl: './topology-item-node.component.html',
  styleUrls: ['./topology-item-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopologyItemNodeComponent {
  @Input() topologyItem: TopologyItem;
  @Input() disk: Disk;

  constructor(
    protected translate: TranslateService,
  ) {}

  get name(): string {
    if ((this.topologyItem as TopologyDisk).disk) {
      return (this.topologyItem as TopologyDisk).disk;
    }
    if (this.isDisk) {
      return this.topologyItem.guid;
    }
    return this.topologyItem.type;
  }

  get status(): string {
    return this.topologyItem?.status ? this.topologyItem.status : '';
  }

  get capacity(): string {
    return this.isDisk && this.disk?.size ? buildNormalizedFileSize(this.disk.size) : '';
  }

  get errors(): string {
    if (this.topologyItem.stats) {
      const stats = this.topologyItem.stats;
      const errors = (stats?.checksum_errors || 0) + (stats?.read_errors || 0) + (stats?.write_errors || 0);
      return this.translate.instant('{n, plural, =0 {No errors} one {# Error} other {# Errors}}', { n: errors });
    }
    return '';
  }

  get statusClass(): string {
    switch (this.topologyItem.status as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
        return 'fn-theme-red';
      case PoolStatus.Degraded:
      case PoolStatus.Offline:
      case TopologyItemStatus.Offline:
        return 'fn-theme-yellow';
      default:
        return '';
    }
  }

  get isDisk(): boolean {
    return Boolean(this.topologyItem.type === TopologyItemType.Disk && this.topologyItem.path);
  }
}
