import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import {
  ManualDiskDragToggleStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import {
  manualSelectionVdevsToVdevs,
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';
import { ManualSelectionDisksComponent } from './components/manual-selection-disks/manual-selection-disks.component';
import { ManualSelectionVdevComponent } from './components/manual-selection-vdev/manual-selection-vdev.component';

export interface ManualDiskSelectionParams {
  layout: CreateVdevLayout;
  enclosures: Enclosure[];
  inventory: DetailsDisk[];
  vdevs: DetailsDisk[][];
  vdevsLimit: number | null;
}

@UntilDestroy()
@Component({
  selector: 'ix-manual-disk-selection',
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    ManualSelectionDisksComponent,
    MatDivider,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    ManualSelectionVdevComponent,
    MatDialogClose,
    TranslateModule,
    AsyncPipe,
  ],
  providers: [
    ManualDiskSelectionStore,
    ManualDiskDragToggleStore,
  ],
})
export class ManualDiskSelectionComponent implements OnInit {
  protected readonly requiredRoles = [Role.DiskWrite];

  isSaveDisabled$ = combineLatest([
    this.manualDiskSelectionStore.vdevs$,
    this.manualDiskSelectionStore.layout$,
  ]).pipe(
    map(([vdevs, layout]) => {
      let vdevError = false;
      for (const vdev of vdevs) {
        if (vdev.disks?.length < minDisksPerLayout[layout]) {
          vdevError = true;
        }
      }

      return vdevError;
    }),
  );

  hideAddVdevButton$ = this.manualDiskSelectionStore.vdevs$.pipe(map((vdevs) => {
    return this.data.vdevsLimit && vdevs.length >= this.data.vdevsLimit;
  }));

  protected currentVdevs: ManualSelectionVdev[];
  private oldVdevs: DetailsDisk[][] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ManualDiskSelectionParams,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    private manualDiskSelectionStore: ManualDiskSelectionStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dialogRef.addPanelClass('manual-disk-selection-ref');
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
