import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import _ from 'lodash';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';

export interface ManualDiskSelectionState {
  layout: CreateVdevLayout;
  vdevs: ManualSelectionVdev[];
  inventory: UnusedDisk[];
}

const initialState: ManualDiskSelectionState = {
  layout: null,
  vdevs: [],
  inventory: [],
};

@Injectable()
export class ManualDiskSelectionStore extends ComponentStore<ManualDiskSelectionState> {
  readonly inventory$ = this.select((state) => state.inventory);
  readonly vdevs$ = this.select((state) => state.vdevs);
  readonly layout$ = this.select((state) => state.layout);

  constructor() {
    super(initialState);
  }

  initialize = this.updater((state: ManualDiskSelectionState, params: ManualDiskSelectionState) => {
    return {
      ...initialState,
      ...params,
    };
  });

  addDiskToVdev = this.updater((
    state: ManualDiskSelectionState,
    vdevUpdate: { disk: UnusedDisk; vdev: ManualSelectionVdev },
  ) => {
    let vdevs = _.cloneDeep(state.vdevs);
    if (!vdevs.length) {
      vdevs = [_.cloneDeep(vdevUpdate.vdev)];
    }
    for (const vdev of vdevs) {
      const diskAlreadyExists = vdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (vdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        const newDisk = _.cloneDeep(vdevUpdate.disk) as ManualSelectionDisk;
        newDisk.vdevUuid = vdev.uuid;
        vdev.disks.push(newDisk);
      }
    }
    const inventory = _.cloneDeep(state.inventory).filter(
      (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
    );
    return {
      ...(_.cloneDeep(state)),
      vdevs,
      inventory,
    };
  });

  removeDiskFromVdev = this.updater((
    state: ManualDiskSelectionState,
    disk: ManualSelectionDisk,
  ) => {
    const vdevs = _.cloneDeep(state.vdevs).map((vdev) => {
      if (vdev.uuid !== disk.vdevUuid) {
        return vdev;
      }

      const newVdev = _.cloneDeep(vdev);
      newVdev.disks = newVdev.disks.filter((vdevDisk) => {
        return vdevDisk.identifier !== disk.identifier;
      });

      return newVdev;
    });

    const inventory = _.cloneDeep(state.inventory);
    const isDiskAlreadyInInventory = inventory.some((unusedDisk) => unusedDisk.identifier === disk.identifier);
    if (!isDiskAlreadyInInventory) {
      const newDisk = _.cloneDeep(disk);
      newDisk.vdevUuid = null;
      inventory.push(newDisk);
    }
    return {
      ...(_.cloneDeep(state)),
      vdevs,
      inventory,
    };
  });

  addVdev = this.updater((state: ManualDiskSelectionState) => {
    const newState = _.cloneDeep(state);
    return {
      ...newState,
      vdevs: [
        ...newState.vdevs,
        {
          disks: [],
          // TODO: Get rid of UUIDs?
          uuid: UUID.UUID(),
        },
      ],
    };
  });

  removeVdev = this.updater((state: ManualDiskSelectionState, vdevToRemove: ManualSelectionVdev) => {
    const vdevs = _.cloneDeep(state.vdevs).filter((vdev) => vdev.uuid !== vdevToRemove.uuid);
    const inventory = _.cloneDeep(state.inventory);
    for (const disk of vdevToRemove.disks) {
      const isDiskAlreadyInInventory = inventory.some((unusedDisk) => unusedDisk.identifier === disk.identifier);
      if (!isDiskAlreadyInInventory) {
        const newDisk = _.cloneDeep(disk);
        newDisk.vdevUuid = null;
        inventory.push(newDisk);
      }
    }
    return {
      ...(_.cloneDeep(state)),
      vdevs,
      inventory,
    };
  });
}
