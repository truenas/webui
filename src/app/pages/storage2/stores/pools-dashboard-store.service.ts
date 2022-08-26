import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import { forkJoin, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface PoolsDashboardState {
  isLoading: boolean;
  pools: Pool[];
  rootDatasets: { [id: string]: Dataset };
}

const initialState: PoolsDashboardState = {
  isLoading: false,
  pools: [],
  rootDatasets: {},
};

@Injectable()
export class PoolsDashboardStore extends ComponentStore<PoolsDashboardState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly isLoading$ = this.select((state) => state.isLoading);
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
          isLoading: true,
        });
      }),
      switchMap(() => {
        return forkJoin([
          this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]),
          this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]),
        ]).pipe(
          tapResponse(
            ([pools, rootDatasets]) => {
              this.patchState({
                isLoading: false,
                pools: this.sorter.tableSorter(pools, 'name', 'asc'),
                rootDatasets: _.keyBy(rootDatasets, (dataset) => dataset.id),
              });
            },
            (error: WebsocketError) => {
              this.patchState({
                isLoading: false,
              });
              new EntityUtils().handleWsError(this, error, this.dialogService);
            },
          ),
        );
      }),
    );
  });
}
