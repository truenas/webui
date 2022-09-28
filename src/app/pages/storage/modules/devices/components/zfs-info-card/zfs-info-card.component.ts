import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk, isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  ExtendDialogComponent, ExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-zfs-info-card',
  templateUrl: './zfs-info-card.component.html',
  styleUrls: ['./zfs-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZfsInfoCardComponent {
  @Input() topologyItem: TopologyItem;
  @Input() topologyParentItem: TopologyItem;
  @Input() disk: Disk;
  @Input() topologyCategory: PoolTopologyCategory;
  @Input() poolId: number;

  get isMirror(): boolean {
    return this.topologyItem.type === TopologyItemType.Mirror;
  }

  get isDisk(): boolean {
    return isTopologyDisk(this.topologyItem);
  }

  get canExtendDisk(): boolean {
    return this.topologyParentItem.type !== TopologyItemType.Mirror
      && this.topologyItem.type === TopologyItemType.Disk
      && this.topologyCategory === PoolTopologyCategory.Data;
  }

  get canRemoveDisk(): boolean {
    return this.topologyParentItem.type !== TopologyItemType.Mirror
      && this.topologyCategory !== PoolTopologyCategory.Data;
  }

  get canDetachDisk(): boolean {
    return [
      TopologyItemType.Mirror,
      TopologyItemType.Replacing,
      TopologyItemType.Spare,
    ].includes(this.topologyParentItem.type);
  }

  get canOfflineDisk(): boolean {
    return this.topologyItem.status !== TopologyItemStatus.Offline
      && ![PoolTopologyCategory.Spare, PoolTopologyCategory.Cache].includes(this.topologyCategory);
  }

  get canOnlineDisk(): boolean {
    return this.topologyItem.status !== TopologyItemStatus.Online
      && ![PoolTopologyCategory.Spare, PoolTopologyCategory.Cache].includes(this.topologyCategory);
  }

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private devicesStore: DevicesStore,
  ) {}

  onOffline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Offline Disk'),
      message: this.translate.instant('Offline disk {name}?', { name: this.disk.devname }),
      buttonMsg: this.translate.instant('Offline'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.open();
      this.ws.call('pool.offline', [this.poolId, { label: this.topologyItem.guid }]).pipe(
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.devicesStore.reloadList();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
    });
  }

  onOnline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Online Disk'),
      message: this.translate.instant('Online disk {name}?', { name: this.disk.devname }),
      buttonMsg: this.translate.instant('Online'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.open();
      this.ws.call('pool.online', [this.poolId, { label: this.topologyItem.guid }]).pipe(
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.devicesStore.reloadList();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
    });
  }

  onDetach(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Detach Disk'),
      message: this.translate.instant('Detach disk {name}?', { name: this.disk.devname }),
      buttonMsg: this.translate.instant('Detach'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.open();
      this.ws.call('pool.detach', [this.poolId, { label: this.topologyItem.guid }]).pipe(
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.devicesStore.reloadList();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
    });
  }

  onRemove(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove device'),
      message: this.translate.instant(
        'Remove device {name}?',
        { name: this.isDisk ? this.disk.devname : this.topologyItem.name },
      ),
      buttonMsg: this.translate.instant('Remove'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const dialogRef = this.matDialog.open(EntityJobComponent, {
        data: { title: this.translate.instant('Remove device') },
        disableClose: true,
      });
      dialogRef.componentInstance.setCall('pool.remove', [this.poolId, { label: this.topologyItem.guid }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.devicesStore.reloadList();
          this.dialogService.closeAllDialogs();
        },
        error: (error) => {
          this.dialogService.errorReportMiddleware(error);
        },
      });
    });
  }

  onExtend(): void {
    this.matDialog.open(ExtendDialogComponent, {
      data: {
        poolId: this.poolId,
        targetVdevGuid: this.topologyItem.guid,
      } as ExtendDialogParams,
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
