import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Disk } from 'app/interfaces/storage.interface';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
import { ReplaceDiskDialogComponent, ReplaceDiskDialogData } from 'app/pages/storage/volumes/volume-status/components/replace-disk-dialog/replace-disk-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskInfoCardComponent {
  @Input() disk: Disk;
  @Input() poolId: number;

  get diskInfo(): { label: string; value: string | number }[] {
    return [
      { label: this.translate.instant('Disk Size'), value: this.disk.size },
      { label: this.translate.instant('Transfer Mode'), value: this.disk.transfermode },
      { label: this.translate.instant('Serial'), value: this.disk.serial },
      { label: this.translate.instant('Model'), value: this.disk.model },
      { label: this.translate.instant('Rotation Rate'), value: this.disk.rotationrate },
      { label: this.translate.instant('Type'), value: this.disk.type },
      { label: this.translate.instant('HDD Standby'), value: this.disk.hddstandby },
      { label: this.translate.instant('Description'), value: this.disk.description },
    ];
  }

  constructor(
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
  ) {}

  onEdit(): void {
    const editForm = this.slideInService.open(DiskFormComponent, { wide: true });
    editForm.setFormDisk(this.disk);
  }

  onReplace(): void {
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: this.poolId,
          guid: this.disk.zfs_guid,
          diskName: this.disk.name,
        } as ReplaceDiskDialogData,
      });
  }
}
