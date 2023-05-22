import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';

export interface ManualDiskSelectionState {
  layout: CreateVdevLayout;
  vdevs: ManualSelectionVdev[];
  dragActive: boolean;
  inventory: UnusedDisk[];
}

const initialState: ManualDiskSelectionState = {
  layout: null,
  vdevs: [],
  dragActive: false,
  inventory: [],
};

@Injectable()
export class ManualDiskSelectionStore extends ComponentStore<ManualDiskSelectionState> {
  readonly inventory$ = this.select((state) => state.inventory);
  readonly vdevs$ = this.select((state) => state.vdevs);
  readonly layout$ = this.select((state) => state.layout);
  readonly dragActive$ = this.select((state) => state.dragActive);

  constructor() {
    super(initialState);
  }

  initialize = this.updater((state: ManualDiskSelectionState, params: {
    vdevs: ManualSelectionVdev[]; // TODO: transform inside store?
    inventory: UnusedDisk[];
    layout: CreateVdevLayout;
  }) => {
    return {
      ...initialState,
      ...params,
    };
  });

  addDiskToVdev = this.updater((
    state: ManualDiskSelectionState,
    vdevUpdate: { disk: UnusedDisk; vdev: ManualSelectionVdev },
  ) => {
    let vdevs = [...state.vdevs.map((vdev) => ({ ...vdev }))];
    if (!vdevs.length) {
      vdevs = [{ ...vdevUpdate.vdev }];
    }
    for (const vdev of vdevs) {
      const diskAlreadyExists = vdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (vdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        vdev.disks.push({
          ...vdevUpdate.disk,
          vdevUuid: vdev.uuid,
        });
      }
    }
    const inventory = [...state.inventory].filter(
      (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
    );
    return {
      ...state,
      vdevs,
      inventory,
    };
  });

  removeDiskFromVdev = this.updater((
    state: ManualDiskSelectionState,
    disk: ManualSelectionDisk,
  ) => {
    const vdevs = [...state.vdevs].map((vdev) => {
      if (vdev.uuid !== disk.vdevUuid) {
        return vdev;
      }

      return {
        ...vdev,
        disks: vdev.disks.filter((vdevDisk) => {
          return vdevDisk.identifier !== disk.identifier;
        }),
      };
    });
    disk.vdevUuid = null;

    const inventory = [...state.inventory];
    if (!inventory.some((unusedDisk) => unusedDisk.identifier === disk.identifier)) {
      inventory.push(disk);
    }
    return {
      ...state,
      vdevs,
      inventory,
    };
  });

  toggleActivateDrag = this.updater((state: ManualDiskSelectionState, activateDrag: boolean) => {
    return {
      ...state,
      dragActive: activateDrag,
    };
  });

  addVdev = this.updater((state: ManualDiskSelectionState) => {
    return {
      ...state,
      vdevs: [
        ...state.vdevs,
        {
          // TODO: Move somewhere or simplify.
          disks: [],
          rawSize: 0,
          // TODO: Get rid of UUIDs?
          uuid: UUID.UUID(),
        },
      ],
    };
  });

  removeVdev = this.updater((state: ManualDiskSelectionState, vdevToRemove: ManualSelectionVdev) => {
    const vdevs = state.vdevs.filter((vdev) => vdev.uuid !== vdevToRemove.uuid);
    const inventory = [...state.inventory];
    for (const disk of vdevToRemove.disks) {
      const diskAlreadyExists = inventory.some(
        (unusedDisk) => unusedDisk.identifier === disk.identifier,
      );
      if (!diskAlreadyExists) {
        inventory.push(disk);
      }
    }
    return {
      ...state,
      vdevs,
      inventory,
    };
  });
}
