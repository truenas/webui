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
import {
  collectDescendantWarning, criticalSeverity, statusSeverity,
} from 'app/pages/storage/modules/vdevs/utils/descendant-warning';

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
    return (stats.checksum_errors ?? 0) + (stats.read_errors ?? 0) + (stats.write_errors ?? 0);
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

  private readonly descendantWarning = computed(() => collectDescendantWarning(this.topologyItem()));

  protected readonly hasDescendantWarning = computed(() => this.descendantWarning().count > 0);

  protected readonly descendantWarningClass = computed(() => {
    return statusSeverity(this.descendantWarning().worst) >= criticalSeverity
      ? 'severity-critical'
      : 'severity-warning';
  });

  protected readonly descendantWarningTooltip = computed(() => {
    const { count, worst } = this.descendantWarning();
    return this.translate.instant(
      '{count, plural, one {1 disk in this VDEV is {worst}.} other {# disks in this VDEV are non-optimal (worst: {worst}).}}',
      { count, worst },
    );
  });

  private readonly isDisk = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Disk && this.topologyItem().path);
  });
}
