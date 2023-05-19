import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

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

const minDisks = minDisksPerLayout;

@Injectable()
export class ManualDiskSelectionStore extends ComponentStore<ManualDiskSelectionState> {
  readonly inventory$ = this.select((state) => state.inventory);
  readonly vdevs$ = this.select((state) => state.vdevs);
  readonly dragActive$ = this.select((state) => state.dragActive);

  constructor(
    private translate: TranslateService,
  ) {
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
    let vdevs = [...state.vdevs];
    if (!vdevs.length) {
      vdevs = [{ ...vdevUpdate.vdev }];
    }
    // TODO: Mutation. Update to immutable.
    for (const vdev of vdevs) {
      const diskAlreadyExists = vdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (vdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        vdev.disks.push({
          ...vdevUpdate.disk,
          vdevUuid: vdev.uuid,
          real_capacity: 0,
        });
        // TODO: Extract validation somewhere else.
        let vdevErrorMsg: string = null;
        if (vdev.disks?.length < minDisks[state.layout]) {
          const typeKey = Object.entries(CreateVdevLayout).filter(
            ([, value]) => value === state.layout,
          ).map(([key]) => key)[0];
          vdevErrorMsg = this.translate.instant(
            'Atleast {min} disk(s) are required for {vdevType} vdevs',
            { min: minDisks[state.layout], vdevType: typeKey },
          );
        }
        vdev.errorMsg = vdevErrorMsg;
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
      let vdevErrorMsg: string = null;
      if (vdev.disks?.length < minDisks[state.layout]) {
        const typeKey = Object.entries(CreateVdevLayout).filter(
          ([, value]) => value === state.layout,
        ).map(([key]) => key)[0];
        vdevErrorMsg = this.translate.instant(
          'Atleast {min} disk(s) are required for {vdevType} vdevs',
          { min: minDisks[state.layout], vdevType: typeKey },
        );
      }

      return {
        ...vdev,
        errorMsg: vdevErrorMsg,
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
          showDiskSizeError: false,
          rawSize: 0,
          vdevDisksError: false,
          // TODO: Get rid of UUIDs?
          uuid: UUID.UUID(),
          // TODO: Move elsewhere.
          errorMsg: this.translate.instant(
            'Atleast {min} disk(s) are required for {vdevType} vdevs',
            { min: minDisks[state.layout], vdevType: state.layout },
          ),
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
