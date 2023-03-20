import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ManualDiskSelectionLayout {
  type: CreateVdevLayout;
  // TODO:
}

@UntilDestroy()
@Component({
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDiskSelectionComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    public store$: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
  }

  onSaveSelection(): void {
    // TODO: Return currently selected layout (ManualDiskSelectionLayout).
    this.dialogRef.close();
  }
  trackVdevById = (_: number, vdev: ManagerVdev): string => vdev.uuid;
  addVdev(): void {
    const vdev = new ManagerVdev(this.data.type, 'data');
    this.store$.addDataVdev(vdev);
  }
}
