import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, map } from 'rxjs';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import {
  manualSelectionVdevsToVdevs,
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

export interface ManualDiskSelectionParams {
  layout: CreateVdevLayout;
  enclosures: Enclosure[];
  inventory: UnusedDisk[];
  vdevs: UnusedDisk[][];
  vdevsLimit: number | null;
}

@UntilDestroy()
@Component({
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualDiskSelectionComponent implements OnInit {
  isSaveDisabled$ = combineLatest([
    this.manualDiskSelectionStore.vdevs$,
    this.manualDiskSelectionStore.layout$,
  ]).pipe(
    map(([vdevs, layout]) => {
      let vdevError = false;
      let diskSizeError = false;
      const swapondrive = 2;
      let smallestdisk = 0;
      const swapsize = swapondrive * GiB;
      for (const vdev of vdevs) {
        if (vdev.disks?.length < minDisksPerLayout[layout]) {
          vdevError = true;
        }
        for (let i = 0; i < vdev.disks.length; i++) {
          const size = vdev.disks[i].size - swapsize;
          if (i === 0) {
            smallestdisk = size;
          }
          const tenMib = 10 * MiB;
          if (size > smallestdisk + tenMib || size < smallestdisk - tenMib) {
            diskSizeError = true;
          }
        }
      }

      return vdevError || diskSizeError;
    }),
  );

  hideAddVdevButton$ = this.manualDiskSelectionStore.vdevs$.pipe(map((vdevs) => {
    return this.data.vdevsLimit && vdevs.length >= this.data.vdevsLimit;
  }));

  protected currentVdevs: ManualSelectionVdev[];
  private oldVdevs: UnusedDisk[][] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ManualDiskSelectionParams,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    private manualDiskSelectionStore: ManualDiskSelectionStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dialogRef.updateSize('80vw', '80vh');
    this.manualDiskSelectionStore.vdevs$.pipe(untilDestroyed(this)).subscribe((vdevs) => {
      this.currentVdevs = vdevs;
      this.cdr.markForCheck();
    });

    this.oldVdevs = this.data.vdevs;
    this.manualDiskSelectionStore.initialize({
      vdevs: vdevsToManualSelectionVdevs(this.data.vdevs),
      inventory: this.data.inventory,
      layout: this.data.layout,
    });
  }

  onSaveSelection(): void {
    if (this.areVdevsTheSame()) {
      this.dialogRef.close(false);
      return;
    }

    this.dialogRef.close(manualSelectionVdevsToVdevs(this.currentVdevs));
  }

  addVdev(): void {
    this.manualDiskSelectionStore.addVdev();
  }

  protected readonly trackVdevById = (_: number, vdev: ManualSelectionVdev): string => vdev.uuid;

  private areVdevsTheSame(): boolean {
    const newVdevs = this.currentVdevs;

    if (newVdevs.length !== this.oldVdevs.length) {
      return false;
    }

    for (let i = 0; i < newVdevs.length; i++) {
      if (newVdevs[i].disks.length !== this.oldVdevs[i].length) {
        return false;
      }

      for (let n = 0; n < newVdevs[i].disks.length; n++) {
        if (newVdevs[i].disks[n].devname !== this.oldVdevs[i][n].devname) {
          return false;
        }
      }
    }

    return true;
  }
}
