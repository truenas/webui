import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { cloneDeep } from 'lodash-es';
import {
  combineLatest, filter, switchMap, tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Pool, PoolTopology } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface AddVdevsState {
  pool: Pool | null;
  topology: PoolTopology | null;
  isLoading: boolean;
}

const initialState: AddVdevsState = {
  pool: null,
  topology: null,
  isLoading: false,
};

@Injectable()
export class AddVdevsStore extends ComponentStore<AddVdevsState> {
  private diskStore = inject(DiskStore);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly pool$ = this.select((state) => state.pool);
  readonly poolDisks$ = combineLatest([
    this.pool$.pipe(filter(Boolean)),
    this.diskStore.usedDisks$,
  ]).pipe(
    map(([pool, usedDisks]) => {
      return usedDisks.filter((disk) => disk.imported_zpool === pool.name);
    }),
  );

  constructor() {
    super(initialState);
  }

  resetStoreToInitialState(): void {
    this.setState({ ...initialState });
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.setState(() => ({ ...initialState }))),
    );
  });

  loadPoolData = this.effect<number>((triggers$) => {
    return triggers$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap((poolId) => {
        return this.api.call('pool.query', [[['id', '=', +poolId]]]);
      }),
      tapResponse({
        next: (pools) => {
          this.patchState({
            pool: cloneDeep(pools[0]),
            isLoading: false,
          });
        },
        error: (error: unknown) => {
          this.patchState({
            isLoading: false,
          });
          this.errorHandler.showErrorModal(error);
        },
      }),
      filter((pools) => !!pools),
    );
  });
}
