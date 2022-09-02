import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk, TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

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

  private utils: WidgetUtils;

  constructor(
    protected translate: TranslateService,
  ) {
    this.utils = new WidgetUtils();
  }

  get name(): string {
    return (this.topologyItem as TopologyDisk).disk || this.topologyItem.type;
  }

  get status(): string {
    return this.topologyItem?.status ? this.topologyItem.status : '';
  }

  get capacity(): string {
    return this.disk && this.disk?.size ? this.utils.convert(this.disk.size).value
      + this.utils.convert(this.disk.size).units : '';
  }

  get errors(): string {
    if (this.topologyItem.stats) {
      const stats = this.topologyItem.stats;
      const errors = stats?.checksum_errors + stats?.read_errors + stats?.write_errors;
      return this.translate.instant('{n, plural, =0 {No Errors} one {# Error} other {# Errors}}', { n: errors });
    }
    return '';
  }

  get statusColor(): string {
    switch (this.topologyItem.status as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
        return 'var(--red)';
      case PoolStatus.Offline:
        return 'var(--alt-bg2)';
      default:
        return '';
    }
  }
}
