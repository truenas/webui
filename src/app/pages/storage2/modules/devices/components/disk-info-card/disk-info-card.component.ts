import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
import { ReplaceDiskDialogComponent, ReplaceDiskDialogData } from 'app/pages/storage/volumes/volume-status/components/replace-disk-dialog/replace-disk-dialog.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoCardComponent implements OnChanges {
  @Input() disk: VDev;
  loading = false;
  diskInfo: Disk;

  constructor(
    public formatter: IxFormatterService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
  ) {}

  ngOnChanges(): void {
    this.getDiskInfo();

    this.slideInService.onClose$?.pipe(untilDestroyed(this)).subscribe(() => {
      this.getDiskInfo();
    });
  }

  getDiskInfo(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.ws.call('disk.query', [[['devname', '=', this.disk.disk]]])
      .pipe(untilDestroyed(this))
      .subscribe(
        (disks) => {
          this.loading = false;
          this.diskInfo = disks[0];
          this.cdr.markForCheck();
        },
        (error) => {
          this.loading = false;
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      );
  }

  onEdit(): void {
    const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
    editForm.setFormDisk(this.diskInfo);
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId;
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: Number(poolId),
          guid: this.diskInfo.zfs_guid,
          diskName: this.diskInfo.name,
        } as ReplaceDiskDialogData,
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getDiskInfo();
      });
  }
}
