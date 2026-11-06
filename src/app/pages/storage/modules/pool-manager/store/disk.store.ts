import { computed, Injectable, inject } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';
import { sortBy } from 'lodash-es';
import { map, Observable, tap } from 'rxjs';
import { DetailsDisk, DiskDetailsResponse, toDiskDetails } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { isSedCapable } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface DiskState {
  usedDisks: DetailsDisk[];
  unusedDisks: DetailsDisk[];
}

const initialState: DiskState = {
  usedDisks: [],
  unusedDisks: [],
};

@Injectable()
export class DiskStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly usedDisks = this.state.usedDisks;

  readonly selectableDisks = computed(() => {
    const disksWithExportedPools = this.state.usedDisks().filter((disk) => !disk.imported_zpool);
    return sortBy([...this.state.unusedDisks(), ...disksWithExportedPools], 'devname');
  });

  readonly hasSedCapableDisks = computed(() => this.selectableDisks().some((disk) => isSedCapable(disk)));

  loadDisks(): Observable<DiskDetailsResponse> {
    return this.api.call('disk.details').pipe(
      map(toDiskDetails),
      this.errorHandler.withErrorHandler(),
      tap((diskResponse) => {
        patchState(this.state, {
          unusedDisks: diskResponse.unused,
          usedDisks: diskResponse.used,
        });
      }),
    );
  }
}
