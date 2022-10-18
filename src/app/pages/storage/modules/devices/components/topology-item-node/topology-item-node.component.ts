import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk, TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { ReplaceDiskDialogComponent, ReplaceDiskDialogData } from 'app/pages/storage/modules/disks/components/replace-disk-dialog/replace-disk-dialog.component';

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
    private matDialog: MatDialog,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) {
    this.utils = new WidgetUtils();
  }

  get name(): string {
    if ((this.topologyItem as TopologyDisk).disk) {
      return (this.topologyItem as TopologyDisk).disk;
    }
    if (this.isDisk) {
      return this.topologyItem.path;
    }
    return this.topologyItem.type;
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

  get isDisk(): boolean {
    return Boolean(this.topologyItem.type === TopologyItemType.Disk && this.topologyItem.path);
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId;
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: Number(poolId),
          guid: this.topologyItem.guid,
          diskName: this.disk?.name || this.topologyItem.path,
        } as ReplaceDiskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.devicesStore.reloadList();
      });
  }
}
