import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TiB } from 'app/constants/bytes.constant';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ManualDiskSelectionLayout {
  // TODO:
}

@UntilDestroy()
@Component({
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDiskSelectionComponent implements OnInit {
  dataVdevs: ManagerVdev[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
  }

  onSaveSelection(): void {
    // TODO: Return currently selected layout (ManualDiskSelectionLayout).
    this.dialogRef.close();
  }

  addVdev(): void {
    const vdev = new ManagerVdev('stripe', 'data');
    setTimeout(() => {
      vdev.disks.push({
        name: 'spad',
        identifier: 'spad',
        size: 4 * TiB,
        enclosure: {
          number: 1,
          slot: 2,
        },
      } as unknown as ManagerDisk);
      this.cdr.markForCheck();
    }, 2000);
    this.dataVdevs.push(vdev);
  }
}
