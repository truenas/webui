import { Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { cloneDeep } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';

export interface ManualDiskSelectionState {
  layout: CreateVdevLayout | null;
  vdevs: ManualSelectionVdev[];
  inventory: DetailsDisk[];
}

const initialState: ManualDiskSelectionState = {
  layout: null,
  vdevs: [],
  inventory: [],
};

@Injectable()
export class ManualDiskSelectionStore {
  private readonly state = signalState(initialState);

  readonly inventory = this.state.inventory;
  readonly vdevs = this.state.vdevs;
  readonly layout = this.state.layout;

  initialize(params: ManualDiskSelectionState): void {
    patchState(this.state, { ...initialState, ...params });
  }

  addDiskToVdev(vdevUpdate: { disk: DetailsDisk; vdev: ManualSelectionVdev }): void {
    patchState(this.state, (state) => {
      let vdevs = cloneDeep(state.vdevs);
      if (!vdevs.length) {
        vdevs = [cloneDeep(vdevUpdate.vdev)];
      }
      for (const vdev of vdevs) {
        const diskAlreadyExists = vdev.disks.some(
          (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
        );
        if (vdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
          const newDisk = cloneDeep(vdevUpdate.disk) as ManualSelectionDisk;
          newDisk.vdevUuid = vdev.uuid;
          vdev.disks.push(newDisk);
        }
      }
      const inventory = cloneDeep(state.inventory).filter(
        (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
      );
      return { vdevs, inventory };
    });
  }

  removeDiskFromVdev(disk: ManualSelectionDisk): void {
    patchState(this.state, (state) => {
      const vdevs = cloneDeep(state.vdevs).map((vdev) => {
        if (vdev.uuid !== disk.vdevUuid) {
          return vdev;
        }

        const newVdev = cloneDeep(vdev);
        newVdev.disks = newVdev.disks.filter((vdevDisk) => {
          return vdevDisk.identifier !== disk.identifier;
        });

        return newVdev;
      });

      const inventory = cloneDeep(state.inventory);
      const isDiskAlreadyInInventory = inventory.some((unusedDisk) => unusedDisk.identifier === disk.identifier);
      if (!isDiskAlreadyInInventory) {
        const newDisk = cloneDeep(disk);
        newDisk.vdevUuid = null;
        inventory.push(newDisk);
      }
      return { vdevs, inventory };
    });
  }

  addVdev(): void {
    patchState(this.state, (state) => ({
      vdevs: [
        ...cloneDeep(state.vdevs),
        {
          disks: [],
          // TODO: Get rid of UUIDs?
          uuid: uuidv4(),
        },
      ],
    }));
  }

  removeVdev(vdevToRemove: ManualSelectionVdev): void {
    patchState(this.state, (state) => {
      const vdevs = cloneDeep(state.vdevs).filter((vdev) => vdev.uuid !== vdevToRemove.uuid);
      const inventory = cloneDeep(state.inventory);
      for (const disk of vdevToRemove.disks) {
        const isDiskAlreadyInInventory = inventory.some((unusedDisk) => unusedDisk.identifier === disk.identifier);
        if (!isDiskAlreadyInInventory) {
          const newDisk = cloneDeep(disk);
          newDisk.vdevUuid = null;
          inventory.push(newDisk);
        }
      }
      return { vdevs, inventory };
    });
  }
}
