import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { sortBy } from 'lodash-es';
import { map, Observable, tap } from 'rxjs';
import { DetailsDisk, DiskDetailsResponse, toDiskDetails } from 'app/interfaces/disk.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
export class DiskStore extends ComponentStore<DiskState> {
  private api = inject(TypedApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly usedDisks$ = this.select((state) => state.usedDisks);

  readonly selectableDisks$ = this.select(
    this.unusedDisks$,
    this.usedDisks$,
    (unusedDisks, usedDisks) => {
      const disksWithExportedPools = usedDisks.filter((disk) => !disk.imported_zpool);
      return sortBy([...unusedDisks, ...disksWithExportedPools], 'devname');
    },
  );

  readonly hasSedCapableDisks$ = this.select(
    this.selectableDisks$,
    (disks) => disks.some((disk) => isSedCapable(disk)),
  );

  constructor() {
    super(initialState);
  }

  loadDisks(): Observable<DiskDetailsResponse> {
    return this.api.call('disk.details').pipe(
      map(toDiskDetails),
      this.errorHandler.withErrorHandler(),
      tap((diskResponse) => {
        this.patchState({
          unusedDisks: diskResponse.unused,
          usedDisks: diskResponse.used,
        });
      }),
    );
  }
}
