import { computed, Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { cloneDeep } from 'lodash-es';
import { pipe, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool, PoolTopology, toPool } from 'app/interfaces/pool.interface';
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
export class AddVdevsStore {
  private diskStore = inject(DiskStore);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly pool = this.state.pool;
  readonly poolDisks = computed<DetailsDisk[]>(() => {
    const pool = this.state.pool();
    if (!pool) {
      return [];
    }
    return this.diskStore.usedDisks().filter((disk) => disk.imported_zpool === pool.name);
  });

  resetStoreToInitialState(): void {
    patchState(this.state, initialState);
  }

  initialize(): void {
    this.resetStoreToInitialState();
  }

  readonly loadPoolData = rxMethod<number>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap((poolId) => this.api.query('pool.query', [['id', '=', +poolId]]).pipe(
      map((pools) => pools.map(toPool)),
      tapResponse({
        next: (pools) => patchState(this.state, { pool: cloneDeep(pools[0]) }),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
        finalize: () => patchState(this.state, { isLoading: false }),
      }),
    )),
  ));
}
