import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, Observable, switchMap, tap,
} from 'rxjs';
import { PoolManagerDisk, PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
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
  selectionChanged: boolean;
  selectionErrorMsg: string;
}

const initialState: ManualDiskSelectionState = {
  vdevs: {
    data: [],
  },
  dragActive: false,
  unusedDisks: [],
  allUnusedDisks: [],
  enclosures: [],
  selectionChanged: false,
  selectionErrorMsg: '',
};

const minDisks: { [key: string]: number } = {
  [CreateVdevLayout.Stripe]: 1,
  [CreateVdevLayout.Mirror]: 2,
  [CreateVdevLayout.Raidz1]: 3,
  [CreateVdevLayout.Raidz2]: 4,
  [CreateVdevLayout.Raidz3]: 5,
};

@Injectable()
export class ManualDiskSelectionStore extends ComponentStore<ManualDiskSelectionState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly dataVdevs$ = this.select((state) => state.vdevs.data);
  readonly dragActive$ = this.select((state) => state.dragActive);
  readonly selectionErrorMsg$ = this.select((state) => state.selectionErrorMsg);
  constructor(
    private poolManagerStore$: PoolManagerStore,
    private translate: TranslateService,
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
    let didSelectionChange = false;
    for (const dataVdev of dataVdevs) {
      const diskAlreadyExists = dataVdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (dataVdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        didSelectionChange = true;
        dataVdev.disks.push({ ...vdevUpdate.disk, vdevUuid: dataVdev.uuid });
        let vdevErrorMsg: string = null;
        if (dataVdev.disks?.length < minDisks[dataVdev.type]) {
          const typeKey = Object.entries(CreateVdevLayout).filter(
            ([, value]) => value === dataVdev.type,
          ).map(([key]) => key)[0];
          vdevErrorMsg = this.translate.instant(
            'Atleast {min} disk(s) are required for {vdevType} vdevs',
            { min: minDisks[dataVdev.type], vdevType: typeKey },
          );
        }
        dataVdev.errorMsg = vdevErrorMsg;
      }
    }
    const unusedDisks = [...state.unusedDisks].filter(
      (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
    );
    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
      selectionChanged: state.selectionChanged || didSelectionChange,
    };
  });

  removeDiskFromDataVdev = this.updater((
    state: ManualDiskSelectionState,
    disk: PoolManagerVdevDisk,
  ) => {
    let didSelectionChange = false;
    const dataVdevs = [...state.vdevs.data].map((vdev) => {
      if (vdev.uuid === disk.vdevUuid) {
        vdev.disks = vdev.disks.filter((vdevDisk) => {
          if (vdevDisk.identifier === disk.identifier) {
            didSelectionChange = true;
          }
          return vdevDisk.identifier !== disk.identifier;
        });
        let vdevErrorMsg: string = null;
        if (vdev.disks?.length < minDisks[vdev.type]) {
          const typeKey = Object.entries(CreateVdevLayout).filter(
            ([, value]) => value === vdev.type,
          ).map(([key]) => key)[0];
          vdevErrorMsg = this.translate.instant(
            'Atleast {min} disk(s) are required for {vdevType} vdevs',
            { min: minDisks[vdev.type], vdevType: typeKey },
          );
        }
        vdev.errorMsg = vdevErrorMsg;
      }
      return vdev;
    });
    disk.vdevUuid = null;

    const unusedDisks = [...state.unusedDisks];
    if (!unusedDisks.some((unusedDisk) => unusedDisk.identifier === disk.identifier)) {
      unusedDisks.push(disk);
    }
    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
      selectionChanged: state.selectionChanged || didSelectionChange,
    };
  });

  toggleActivateDrag = this.updater((state: ManualDiskSelectionState, activateDrag: boolean) => {
    return {
      ...state,
      dragActive: activateDrag,
    };
  });

  addDataVdev = this.updater((state: ManualDiskSelectionState, vdev: PoolManagerVdev) => {
    const typeKey = Object.entries(CreateVdevLayout).filter(
      ([, value]) => value === vdev.type,
    ).map(([key]) => key)[0];
    return {
      ...state,
      vdevs: {
        ...state.vdevs,
        data: [
          ...state.vdevs.data,
          {
            ...vdev,
            errorMsg: this.translate.instant(
              'Atleast {min} disk(s) are required for {vdevType} vdevs',
              { min: minDisks[vdev.type], vdevType: typeKey },
            ),
          },
        ],
      },
      selectionChanged: true,
    };
  });

  setSelectionErrorMsg = this.updater((state, errMsg: string) => {
    return {
      ...state,
      selectionErrorMsg: errMsg,
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
      selectionChanged: true,
    };
  });
}
