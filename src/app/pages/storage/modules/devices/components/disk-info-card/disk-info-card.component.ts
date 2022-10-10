import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/storage.interface';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import {
  ReplaceDiskDialogComponent,
  ReplaceDiskDialogData,
} from 'app/pages/storage/modules/disks/components/replace-disk-dialog/replace-disk-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoCardComponent implements OnInit {
  @Input() disk: Disk;

  constructor(
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) {}

  get isHdd(): boolean {
    return this.disk?.type === DiskType.Hdd;
  }

  ngOnInit(): void {
    this.slideInService.onClose$?.pipe(
      filter((value) => !!value.response && value.modalType === DiskFormComponent),
      untilDestroyed(this),
    ).subscribe(() => {
      this.devicesStore.reloadList();
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
        this.devicesStore.reloadList();
      });
  }
}
