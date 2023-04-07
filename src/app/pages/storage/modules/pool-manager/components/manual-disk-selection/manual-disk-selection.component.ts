import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManualDiskSelectionState, ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';

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
  manualSelectionState: ManualDiskSelectionState;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    public store$: ManualDiskSelectionStore,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
    this.store$.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.manualSelectionState = state;
    });
  }

  onSaveSelection(): void {
    this.dialogRef.close(this.manualSelectionState);
  }

  trackVdevById = (_: number, vdev: ManagerVdev): string => vdev.uuid;

  addVdev(): void {
    const vdev = new PoolManagerVdev(this.data.type, 'data');
    this.store$.addDataVdev(vdev);
  }
}
