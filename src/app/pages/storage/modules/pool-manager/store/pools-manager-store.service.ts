import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import {
  combineLatest, forkJoin, Observable, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface PoolsManagerState {
  arePoolsLoading: boolean;
  areUnusedDisksLoading: boolean;
  pools: Pool[];
  unusedDisks: UnusedDisk[];
  rootDatasets: { [id: string]: Dataset };
  formValue: PoolManagerWizardFormValue;
}

const initialState: PoolsManagerState = {
  arePoolsLoading: false,
  areUnusedDisksLoading: false,
  pools: [],
  rootDatasets: {},
  unusedDisks: [],
  formValue: null,
};

interface ManagerPools {
  pools: Pool[];
  rootDatasets: Dataset[];
}

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolsManagerState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly arePoolsLoading$ = this.select((state) => state.arePoolsLoading);
  readonly areUnusedDisksLoading$ = this.select((state) => state.areUnusedDisksLoading);
  readonly rootDatasets$ = this.select((state) => state.rootDatasets);
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly formValue$ = this.select((state) => state.formValue);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private sorter: StorageService,
  ) {
    super(initialState);
  }

  readonly loadPoolsData = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          arePoolsLoading: true,
          areUnusedDisksLoading: true,
        });
      }),
      switchMap(() => this.updateState()),
    );
  });

  updateState(): Observable<{
    dashboardPools: ManagerPools;
    unusedDisks: UnusedDisk[];
  }> {
    return forkJoin({
      dashboardPools: this.getPoolsAndRootDatasets().pipe(
        this.patchStateWithPoolData(),
      ),
      unusedDisks: this.getUnusedDisks().pipe(
        this.patchStateWithUnusedDisksData(),
      ),
    });
  }

  getPoolsAndRootDatasets(): Observable<ManagerPools> {
    return combineLatest({
      pools: this.getPools(),
      rootDatasets: this.getRootDatasets(),
    });
  }

  getUnusedDisks(): Observable<UnusedDisk[]> {
    return this.ws.call('disk.get_unused', []);
  }

  patchStateWithPoolData(): (source: Observable<ManagerPools>) => Observable<ManagerPools> {
    return tapResponse<ManagerPools>(
      ({ pools, rootDatasets }) => {
        this.patchState({
          arePoolsLoading: false,
          pools: this.sorter.tableSorter(pools, 'name', 'asc'),
          rootDatasets: _.keyBy(rootDatasets, (dataset) => dataset.id),
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          arePoolsLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  patchStateWithUnusedDisksData(): (source: Observable<UnusedDisk[]>) => Observable<UnusedDisk[]> {
    return tapResponse<UnusedDisk[]>(
      (unusedDisks) => {
        this.patchState({
          areUnusedDisksLoading: false,
          unusedDisks,
        });
      },
      (error: WebsocketError) => {
        this.patchState({
          areUnusedDisksLoading: false,
        });
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  getPools(): Observable<Pool[]> {
    return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  getRootDatasets(): Observable<Dataset[]> {
    return this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]);
  }

  updateFormValue = this.updater((state: PoolsManagerState, updatedFormValue: PoolManagerWizardFormValue) => {
    return {
      ...state,
      formValue: updatedFormValue,
    };
  });
}
