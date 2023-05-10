import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManualDiskSelectionState, ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';
import { PoolManagerState, OldPoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

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
  isSaveDisabled$ = this.manualDiskSelectionStore.dataVdevs$.pipe(
    map((vdevs) => vdevs.some((vdev) => !!vdev.errorMsg)),
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    public manualDiskSelectionStore: ManualDiskSelectionStore,
    public poolManagerStore: OldPoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
    this.manualDiskSelectionStore.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.manualSelectionState = state;
    });
    this.poolManagerStore.select((state: PoolManagerState) => {
      return {
        vdevs: state.vdevs,
        allUnusedDisks: state.allUnusedDisks,
        unusedDisks: state.unusedDisks,
      };
    }).pipe(untilDestroyed(this)).subscribe(({ vdevs, allUnusedDisks, unusedDisks }) => {
      this.manualDiskSelectionStore.patchState((state: ManualDiskSelectionState) => {
        return {
          ...state,
          vdevs: { ...vdevs },
          unusedDisks: [...unusedDisks],
          allUnusedDisks: [...allUnusedDisks],
        };
      });
    });
  }

  onSaveSelection(): void {
    this.dialogRef.close(true);
  }

  trackVdevById = (_: number, vdev: ManagerVdev): string => vdev.uuid;

  addVdev(): void {
    const vdev = new PoolManagerVdev(this.data.type, 'data');
    this.manualDiskSelectionStore.addDataVdev(vdev);
  }
}
