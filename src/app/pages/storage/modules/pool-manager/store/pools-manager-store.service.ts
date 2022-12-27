import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import {
  combineLatest, forkJoin, Observable, tap,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface PoolsManagerState {
  arePoolsLoading: boolean;
  pools: Pool[];
  rootDatasets: { [id: string]: Dataset };
}

const initialState: PoolsManagerState = {
  arePoolsLoading: false,
  pools: [],
  rootDatasets: {},
};

interface ManagerPools {
  pools: Pool[];
  rootDatasets: Dataset[];
}

@Injectable()
export class PoolsManagerStore extends ComponentStore<PoolsManagerState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly arePoolsLoading$ = this.select((state) => state.arePoolsLoading);
  readonly rootDatasets$ = this.select((state) => state.rootDatasets);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private sorter: StorageService,
  ) {
    super(initialState);
  }

  readonly loadDashboard = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          arePoolsLoading: true,
        });
      }),
      switchMap(() => this.updatePoolsAndDisksState()),
    );
  });

  updatePoolsAndDisksState(): Observable<{
    dashboardPools: ManagerPools;
  }> {
    return forkJoin({
      dashboardPools: this.getPoolsAndRootDatasets().pipe(
        this.patchStateWithPoolData(),
      ),
    });
  }

  getPoolsAndRootDatasets(): Observable<ManagerPools> {
    return combineLatest({
      pools: this.getPools(),
      rootDatasets: this.getRootDatasets(),
    });
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

  getPools(): Observable<Pool[]> {
    return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]);
  }

  getRootDatasets(): Observable<Dataset[]> {
    return this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]);
  }
}
