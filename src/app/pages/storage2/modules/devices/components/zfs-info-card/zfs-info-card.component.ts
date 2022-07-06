import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage2/modules/disks/components/disk-form/disk-form.component';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-zfs-info-card',
  templateUrl: './zfs-info-card.component.html',
  styleUrls: ['./zfs-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZfsInfoCardComponent implements OnInit {
  @Input() topologyItem: VDev;
  @Input() topologyParentItem: VDev;
  @Input() disk: Disk;
  private poolId: number;

  get readErrors(): number {
    if (this.isMirror) {
      return this.topologyItem.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.read_errors || 0);
      }, 0);
    }
    return this.topologyItem.stats.read_errors;
  }

  get writeErrors(): number {
    if (this.isMirror) {
      return this.topologyItem.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.write_errors || 0);
      }, 0);
    }
    return this.topologyItem.stats.write_errors;
  }

  get checksumErrors(): number {
    if (this.isMirror) {
      return this.topologyItem.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }
    return this.topologyItem.stats.checksum_errors;
  }

  get isMirror(): boolean {
    return this.topologyItem.type === VDevType.Mirror;
  }

  get isDisk(): boolean {
    return this.topologyItem.type === VDevType.Disk;
  }

  get isOnline(): boolean {
    return this.topologyItem.status === VDevStatus.Online;
  }

  constructor(
    private loader: AppLoaderService,
    private route: ActivatedRoute,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private devicesStore: DevicesStore,
  ) {}

  ngOnInit(): void {
    this.poolId = +this.route.snapshot.paramMap.get('poolId');
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.devicesStore.reloadList();
    });
  }

  onEdit(): void {
    const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
    editForm.setFormDisk(this.disk);
  }

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
      ).subscribe(() => {
        this.devicesStore.reloadList();
        this.loader.close();
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialogService);
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
      ).subscribe(() => {
        this.devicesStore.reloadList();
        this.loader.close();
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialogService);
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
      ).subscribe(() => {
        this.devicesStore.reloadList();
        this.loader.close();
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialogService);
      });
    });
  }

  onRemove(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove Disk'),
      message: this.translate.instant('Remove disk {name}?', { name: this.disk.devname }),
      buttonMsg: this.translate.instant('Remove'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const dialogRef = this.matDialog.open(EntityJobComponent, {
        data: { title: this.translate.instant('Remove Disk') },
        disableClose: true,
      });
      dialogRef.componentInstance.setCall('pool.remove', [this.poolId, { label: this.topologyItem.guid }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.devicesStore.reloadList();
        this.dialogService.closeAllDialogs();
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
        new EntityUtils().handleWsError(this, error, this.dialogService);
      });
    });
  }
}
