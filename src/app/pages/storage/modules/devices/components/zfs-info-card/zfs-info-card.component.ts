import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import { VdevType, TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk, isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  ExtendDialogComponent, ExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

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
  @Input() topologyCategory: VdevType;
  @Input() poolId: number;
  @Input() hasTopLevelRaidz: boolean;

  get isMirror(): boolean {
    return this.topologyItem.type === TopologyItemType.Mirror;
  }

  get isRaidzParent(): boolean {
    return raidzItems.includes(this.topologyItem.type);
  }

  get isDisk(): boolean {
    return isTopologyDisk(this.topologyItem);
  }

  get canExtendDisk(): boolean {
    return this.topologyParentItem.type !== TopologyItemType.Mirror
      && !this.isRaidzParent
      && this.topologyItem.type === TopologyItemType.Disk
      && (this.topologyCategory === VdevType.Data
        || this.topologyCategory === VdevType.Dedup
        || this.topologyCategory === VdevType.Special
      ) && this.topologyItem.status !== TopologyItemStatus.Unavail;
  }

  get canRemoveDisk(): boolean {
    return this.topologyParentItem.type !== TopologyItemType.Mirror
    && !this.isRaidzParent
    && (!this.hasTopLevelRaidz
    || this.topologyCategory === VdevType.Cache
    || this.topologyCategory === VdevType.Log);
  }

  get canRemoveVDEV(): boolean {
    return !this.hasTopLevelRaidz
    || this.topologyCategory === VdevType.Cache
    || this.topologyCategory === VdevType.Log;
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
      && ![VdevType.Spare, VdevType.Cache].includes(this.topologyCategory)
      && this.topologyItem.status !== TopologyItemStatus.Unavail;
  }

  get canOnlineDisk(): boolean {
    return this.topologyItem.status !== TopologyItemStatus.Online
      && ![VdevType.Spare, VdevType.Cache].includes(this.topologyCategory)
      && this.topologyItem.status !== TopologyItemStatus.Unavail;
  }

  constructor(
    private errorHandler: ErrorHandlerService,
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
      message: this.translate.instant('Offline disk {name}?', { name: this.disk?.devname || this.topologyItem.guid }),
      buttonText: this.translate.instant('Offline'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('pool.offline', [this.poolId, { label: this.topologyItem.guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
          untilDestroyed(this),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onOnline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Online Disk'),
      message: this.translate.instant('Online disk {name}?', { name: this.disk?.devname || this.topologyItem.guid }),
      buttonText: this.translate.instant('Online'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('pool.online', [this.poolId, { label: this.topologyItem.guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onDetach(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Detach Disk'),
      message: this.translate.instant('Detach disk {name}?', { name: this.disk?.devname || this.topologyItem.guid }),
      buttonText: this.translate.instant('Detach'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('pool.detach', [this.poolId, { label: this.topologyItem.guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onRemove(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove device'),
      message: this.translate.instant(
        'Remove device {name}?',
        { name: this.isDisk ? this.disk?.devname || this.topologyItem.guid : this.topologyItem.name },
      ),
      buttonText: this.translate.instant('Remove'),
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
