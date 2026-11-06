import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, Component, computed, OnInit, inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnDividerComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
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
  isSedEncryption?: boolean;
}

@Component({
  selector: 'ix-manual-disk-selection',
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ManualSelectionDisksComponent,
    TnDividerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    ManualSelectionVdevComponent,
    TranslateModule,
  ],
  providers: [
    ManualDiskSelectionStore,
    ManualDiskDragToggleStore,
  ],
})
export class ManualDiskSelectionComponent implements OnInit {
  protected data = inject<ManualDiskSelectionParams>(DIALOG_DATA);
  protected dialogRef = inject<DialogRef<unknown, ManualDiskSelectionComponent>>(DialogRef);
  private manualDiskSelectionStore = inject(ManualDiskSelectionStore);

  protected readonly requiredRoles = [Role.DiskWrite];

  protected currentVdevs = this.manualDiskSelectionStore.vdevs;

  protected isSaveDisabled = computed(() => {
    const layout = this.manualDiskSelectionStore.layout();
    if (!layout) {
      return false;
    }
    return this.currentVdevs().some((vdev) => vdev.disks?.length < minDisksPerLayout[layout]);
  });

  protected hideAddVdevButton = computed(() => {
    return Boolean(this.data.vdevsLimit && this.currentVdevs().length >= this.data.vdevsLimit);
  });

  private oldVdevs: DetailsDisk[][] = [];

  ngOnInit(): void {
    this.dialogRef.addPanelClass('manual-disk-selection-ref');
    this.dialogRef.updateSize('80vw', '80vh');
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

    this.dialogRef.close(manualSelectionVdevsToVdevs(this.currentVdevs()));
  }

  addVdev(): void {
    this.manualDiskSelectionStore.addVdev();
  }

  protected readonly trackVdevById = (_: number, vdev: ManualSelectionVdev): string => vdev.uuid;

  private areVdevsTheSame(): boolean {
    const newVdevs = this.currentVdevs();

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
