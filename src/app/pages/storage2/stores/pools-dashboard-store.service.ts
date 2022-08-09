import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Pool } from 'app/interfaces/pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, StorageService, WebSocketService } from 'app/services';

export interface PoolsDashboardState {
  isLoading: boolean;
  pools: Pool[];
}

const initialState: PoolsDashboardState = {
  isLoading: false,
  pools: [],
};

@Injectable()
export class PoolsDashboardStore extends ComponentStore<PoolsDashboardState> {
  readonly pools$ = this.select((state) => state.pools);
  readonly isLoading$ = this.select((state) => state.isLoading);

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
        return this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]).pipe(
          tapResponse(
            (pools: Pool[]) => {
              this.patchState({
                isLoading: false,
                pools: this.sorter.tableSorter(pools, 'name', 'asc'),
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
