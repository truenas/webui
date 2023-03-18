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

export interface PoolManagerState {
  isLoading: boolean;

  unusedDisks: UnusedDisk[];
  enclosures: Enclosure[];
  dataVdevs: ManagerVdev[];
  formValue: PoolManagerWizardFormValue;
}

const initialState: PoolManagerState = {
  isLoading: false,
  dataVdevs: [],
  unusedDisks: [],
  enclosures: [],
  formValue: null,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly formValue$ = this.select((state) => state.formValue);
  readonly dataVdevs$ = this.select((state) => state.dataVdevs);

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
    enclosureUpdate: { disk: ManagerDisk; vdev: ManagerVdev },
  ) => {
    let dataVdevs = [...state.dataVdevs];
    if (!dataVdevs.length) {
      dataVdevs = [{ ...enclosureUpdate.vdev }];
    }
    for (const dataVdev of dataVdevs) {
      const diskAlreadyExists = dataVdev.disks.some(
        (vdevDisk) => vdevDisk.identifier === enclosureUpdate.disk.identifier,
      );
      if (dataVdev.uuid === enclosureUpdate.vdev.uuid && !diskAlreadyExists) {
        dataVdev.disks.push(enclosureUpdate.disk);
      }
    }
    const unusedDisks = [...state.unusedDisks].filter(
      (unusedDisk) => unusedDisk.identifier !== enclosureUpdate.disk.identifier,
    );
    return {
      ...state,
      dataVdevs,
      unusedDisks,
    };
  });

  removeFromDataVdev = this.updater((
    state: PoolManagerState,
    enclosureUpdate: { disk: ManagerDisk; vdev: ManagerVdev },
  ) => {
    const dataVdevs = [...state.dataVdevs];
    for (const dataVdev of dataVdevs) {
      if (dataVdev.uuid === enclosureUpdate.vdev.uuid) {
        dataVdev.disks = dataVdev.disks.filter((vdevDisk) => vdevDisk.identifier !== enclosureUpdate.disk.identifier);
      }
    }

    const unusedDisks = [...state.unusedDisks, enclosureUpdate.disk];
    return {
      ...state,
      dataVdevs,
      unusedDisks,
    };
  });

  addDataVdev = this.updater((state: PoolManagerState, vdev: ManagerVdev) => {
    return {
      ...state,
      dataVdevs: [...state.dataVdevs, { ...vdev }],
    };
  });

  removeDataVdev = this.updater((state: PoolManagerState, vdev: ManagerVdev) => {
    return {
      ...state,
      dataVdevs: state.dataVdevs.filter((dataVdev) => dataVdev.uuid !== vdev.uuid),
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
