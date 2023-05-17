import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskSelectionState, ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import {
  manualSelectionVdevsToVdevs,
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';

export interface ManualDiskSelectionParams {
  layout: CreateVdevLayout;
  enclosures: Enclosure[];
  inventory: UnusedDisk[];
  vdevs: UnusedDisk[][];
}

@UntilDestroy()
@Component({
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDiskSelectionComponent implements OnInit {
  manualSelectionState: ManualDiskSelectionState;
  isSaveDisabled$ = this.manualDiskSelectionStore.vdevs$.pipe(
    map((vdevs) => vdevs.some((vdev) => !!vdev.errorMsg)),
  );

  private oldVdevs: UnusedDisk[][] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ManualDiskSelectionParams,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    protected manualDiskSelectionStore: ManualDiskSelectionStore,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
    this.manualDiskSelectionStore.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.manualSelectionState = state;
    });

    this.oldVdevs = this.data.vdevs;
    this.manualDiskSelectionStore.initialize({
      vdevs: vdevsToManualSelectionVdevs(this.data.vdevs),
      inventory: this.data.inventory,
      layout: this.data.layout,
    });
  }

  onSaveSelection(): void {
    const newVdevs = this.manualSelectionState.vdevs;
    // TODO: Compare if there are any changes.

    this.dialogRef.close(manualSelectionVdevsToVdevs(newVdevs));
  }

  trackVdevById = (_: number, vdev: ManualSelectionVdev): string => vdev.uuid;

  addVdev(): void {
    this.manualDiskSelectionStore.addVdev();
  }
}
