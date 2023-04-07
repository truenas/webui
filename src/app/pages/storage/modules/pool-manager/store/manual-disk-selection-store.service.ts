import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, Observable, switchMap, tap,
} from 'rxjs';
import { PoolManagerDisk, PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

export interface ManualDiskSelectionState {
  vdevs: {
    data: PoolManagerVdev[];
  };
  dragActive: boolean;
  unusedDisks: PoolManagerDisk[];
  allUnusedDisks: PoolManagerDisk[];
  enclosures: Enclosure[];
}

const initialState: ManualDiskSelectionState = {
  vdevs: {
    data: [],
  },
  dragActive: false,
  unusedDisks: [],
  allUnusedDisks: [],
  enclosures: [],
};

@Injectable()
export class ManualDiskSelectionStore extends ComponentStore<ManualDiskSelectionState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly dataVdevs$ = this.select((state) => state.vdevs.data);
  readonly dragActive$ = this.select((state) => state.dragActive);

  constructor(
    private poolManagerStore$: PoolManagerStore,
  ) {
    super(initialState);
    this.initialize();
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
        });
      }),
      switchMap(() => combineLatest([
        this.poolManagerStore$.select((state: PoolManagerState) => state.allUnusedDisks),
        this.poolManagerStore$.unusedDisks$,
        this.poolManagerStore$.enclosures$,
      ])),
      tap(([allUnusedDisks, unusedDisks, enclosures]) => {
        this.patchState({
          allUnusedDisks: [...allUnusedDisks],
          unusedDisks: [...unusedDisks],
          enclosures: [...enclosures],
        });
      }),
    );
  });

  addDiskToDataVdev = this.updater((
    state: ManualDiskSelectionState,
    vdevUpdate: { disk: PoolManagerDisk; vdev: PoolManagerVdev },
  ) => {
    let dataVdevs = [...state.vdevs.data];
    if (!dataVdevs.length) {
      dataVdevs = [{ ...vdevUpdate.vdev }];
    }
    for (const dataVdev of dataVdevs) {
      const diskAlreadyExists = dataVdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (dataVdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        dataVdev.disks.push({ ...vdevUpdate.disk, vdevUuid: dataVdev.uuid });
      }
    }
    const unusedDisks = [...state.unusedDisks].filter(
      (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
    );
    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
    };
  });

  removeDiskFromDataVdev = this.updater((
    state: ManualDiskSelectionState,
    disk: PoolManagerVdevDisk,
  ) => {
    const dataVdevs = [...state.vdevs.data].map((vdev) => {
      if (vdev.uuid === disk.vdevUuid) {
        vdev.disks = vdev.disks.filter((vdevDisk) => vdevDisk.identifier !== disk.identifier);
      }
      return vdev;
    });

    const unusedDisks = [...state.unusedDisks];
    if (!unusedDisks.some((unusedDisk) => unusedDisk.identifier === disk.identifier)) {
      unusedDisks.push(disk);
    }
    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
    };
  });

  toggleActivateDrag = this.updater((state: ManualDiskSelectionState, activateDrag: boolean) => {
    return {
      ...state,
      dragActive: activateDrag,
    };
  });

  addDataVdev = this.updater((state: ManualDiskSelectionState, vdev: PoolManagerVdev) => {
    return {
      ...state,
      vdevs: { ...state.vdevs, data: [...state.vdevs.data, { ...vdev }] },
    };
  });

  removeDataVdev = this.updater((state: ManualDiskSelectionState, vdev: PoolManagerVdev) => {
    const dataVdevs = state.vdevs.data.filter((dataVdev) => dataVdev.uuid !== vdev.uuid);
    const unusedDisks = [...state.unusedDisks];
    for (const disk of vdev.disks) {
      const diskAlreadyExists = unusedDisks.some(
        (unusedDisk) => unusedDisk.identifier === disk.identifier,
      );
      if (!diskAlreadyExists) {
        unusedDisks.push(disk);
      }
    }
    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
    };
  });
}
