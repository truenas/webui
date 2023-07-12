import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import _ from 'lodash';
import {
  filter, switchMap, tap,
} from 'rxjs';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface AddVdevsState {
  pool: Pool;
  topology: PoolTopology;
  isLoading: boolean;
  poolDisks: Disk[];
}

const initialState: AddVdevsState = {
  pool: null,
  topology: null,
  poolDisks: [],
  isLoading: false,
};

@Injectable()
export class AddVdevsStore extends ComponentStore<AddVdevsState> {
  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly pool$ = this.select((state) => _.cloneDeep(state.pool));
  readonly poolDisks$ = this.select((state) => state.poolDisks);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  loadPoolData = this.effect<number>((triggers$) => {
    return triggers$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap((poolId) => {
        return this.ws.call('pool.query', [[['id', '=', +poolId]]]);
      }),
      tapResponse<Pool[]>(
        (pools: Pool[]) => {
          this.patchState({
            pool: _.cloneDeep(pools[0]),
          });
        },
        (error: WebsocketError) => {
          this.patchState({
            isLoading: false,
          });
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      ),
      filter((pools) => !!pools),
      switchMap((pools: Pool[]) => this.ws.call(
        'disk.query',
        [
          [['pool', '=', pools[0].name]],
          { extra: { pools: true } },
        ],
      )),
      tapResponse<Disk[], WebsocketError>(
        (disks: Disk[]) => {
          this.setState((state: AddVdevsState): AddVdevsState => {
            return {
              ...state,
              poolDisks: _.cloneDeep(disks),
              isLoading: false,
            };
          });
        },
        (error) => {
          this.patchState({
            isLoading: false,
          });
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      ),
    );
  });
}
