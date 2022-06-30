import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
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
export class DiskInfoCardComponent implements OnInit {
  @Input() topologyItem: VDev;
  @Input() disk: Disk;
  emptyInfoConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: false,
    title: this.translate.instant('No Disk Info'),
    message: this.translate.instant('To load Disk Info reselect from the list.'),
  };

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.slideInService.onClose$?.pipe(untilDestroyed(this)).subscribe(() => {
      // TODO: Inform parent to reload tree.
    });
  }

  onEdit(): void {
    const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
    editForm.setFormDisk(this.disk);
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId;
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: Number(poolId),
          guid: this.disk.zfs_guid,
          diskName: this.disk.name,
        } as ReplaceDiskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        // TODO: Reload tree (or at least current disk).
      });
  }
}
