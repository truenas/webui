import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { forkJoin, Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { DialogService, WebSocketService } from 'app/services';

export type VdevManagerDisk = ManagerDisk & { vdevUuid: string };

export interface PoolManagerState {
  isLoading: boolean;

  unusedDisks: UnusedDisk[];
  enclosures: Enclosure[];
  dataVdevs: ManagerVdev[];
  formValue: PoolManagerWizardFormValue;
  dragActive: boolean;
}

const initialState: PoolManagerState = {
  isLoading: false,
  dataVdevs: [],
  unusedDisks: [],
  enclosures: [],
  dragActive: false,
  formValue: null,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly formValue$ = this.select((state) => state.formValue);
  readonly dataVdevs$ = this.select((state) => state.dataVdevs);
  readonly dragActive$ = this.select((state) => state.dragActive);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return forkJoin([
          this.loadUnusedDisks(),
          this.loadEnclosures(),
        ]).pipe(
          tapResponse(() => {
            this.patchState({
              isLoading: false,
            });
          },
          (error: WebsocketError) => {
            this.patchState({
              isLoading: false,
            });
            new EntityUtils().handleWsError(this, error, this.dialogService);
          }),
        );
      }),
    );
  });

  updateFormValue = this.updater((state: PoolManagerState, updatedFormValue: PoolManagerWizardFormValue) => {
    return {
      ...state,
      formValue: updatedFormValue,
    };
  });

  addToDataVdev = this.updater((
    state: PoolManagerState,
    vdevUpdate: { disk: ManagerDisk; vdev: ManagerVdev },
  ) => {
    let dataVdevs = [...state.dataVdevs];
    if (!dataVdevs.length) {
      dataVdevs = [{ ...vdevUpdate.vdev }];
    }
    for (const dataVdev of dataVdevs) {
      const diskAlreadyExists = dataVdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === vdevUpdate.disk.identifier,
      );
      if (dataVdev.uuid === vdevUpdate.vdev.uuid && !diskAlreadyExists) {
        dataVdev.disks.push(vdevUpdate.disk);
      }
    }
    const unusedDisks = [...state.unusedDisks].filter(
      (unusedDisk) => unusedDisk.identifier !== vdevUpdate.disk.identifier,
    );
    return {
      ...state,
      dataVdevs,
      unusedDisks,
    };
  });

  removeFromDataVdev = this.updater((
    state: PoolManagerState,
    disk: VdevManagerDisk,
  ) => {
    const dataVdevs = [...state.dataVdevs].map((vdev) => {
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
      dataVdevs,
      unusedDisks,
    };
  });

  toggleActivateDrag = this.updater((state: PoolManagerState, activateDrag: boolean) => {
    return {
      ...state,
      dragActive: activateDrag,
    };
  });

  addDataVdev = this.updater((state: PoolManagerState, vdev: ManagerVdev) => {
    return {
      ...state,
      dataVdevs: [...state.dataVdevs, { ...vdev }],
    };
  });

  removeDataVdev = this.updater((state: PoolManagerState, vdev: ManagerVdev) => {
    const dataVdevs = state.dataVdevs.filter((dataVdev) => dataVdev.uuid !== vdev.uuid);
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
      dataVdevs,
      unusedDisks,
    };
  });

  private loadUnusedDisks(): Observable<UnusedDisk[]> {
    return this.ws.call('disk.get_unused').pipe(
      tap((unusedDisks) => {
        this.patchState({ unusedDisks });
      }),
    );
  }

  private loadEnclosures(): Observable<Enclosure[]> {
    return this.ws.call('enclosure.query').pipe(
      tap((enclosures) => {
        this.patchState({ enclosures });
      }),
    );
  }
}
