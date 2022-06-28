import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDev } from 'app/interfaces/storage.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
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
  @Input() disk: VDev;
  poolId = 1;
  loading = false;

  get readErrors(): number {
    if (this.isMirror) {
      return this.disk.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.read_errors || 0);
      }, 0);
    }
    return this.disk.stats.read_errors;
  }

  get writeErrors(): number {
    if (this.isMirror) {
      return this.disk.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.write_errors || 0);
      }, 0);
    }
    return this.disk.stats.write_errors;
  }

  get checksumErrors(): number {
    if (this.isMirror) {
      return this.disk.children.reduce((errors, vdev) => {
        return errors + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }
    return this.disk.stats.checksum_errors;
  }

  get isMirror(): boolean {
    return this.disk.type === VDevType.Mirror;
  }

  get isDisk(): boolean {
    return this.disk.type === VDevType.Disk;
  }

  constructor(
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    console.info('Zfs Info Card', this.disk);
  }

  onEdit(): void {
    this.slideIn.open(DiskFormComponent, { wide: true });
  }

  onOffline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Offline Disk'),
      message: this.translate.instant('Offline disk {name}?', { name: this.disk.disk || this.disk.guid }),
      buttonMsg: this.translate.instant('Offline'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const value = { label: this.disk.guid };
      this.ws.call('pool.offline', [this.poolId, value]).pipe(untilDestroyed(this)).subscribe(
        () => {},
        (err) => {
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      );
    });
  }

  onDetach(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Detach Disk'),
      message: this.translate.instant('Detach disk {name}?', { name: this.disk.disk || this.disk.guid }),
      buttonMsg: this.translate.instant('Detach'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.ws.call('pool.detach', [this.poolId, { label: this.disk.guid }]).pipe(untilDestroyed(this)).subscribe(
        () => {},
        (err) => {
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      );
    });
  }

  onRemove(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove Disk'),
      message: this.translate.instant('Remove disk {name}?', { name: this.disk.disk || this.disk.guid }),
      buttonMsg: this.translate.instant('Remove'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      const dialogRef = this.matDialog.open(EntityJobComponent, {
        data: { title: this.translate.instant('Remove Disk') },
        disableClose: true,
      });
      dialogRef.componentInstance.setCall('pool.remove', [this.poolId, { label: this.disk.disk || this.disk.guid }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogService.closeAllDialogs();
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
        new EntityUtils().handleWsError(this, error, this.dialogService);
      });
    });
  }
}
