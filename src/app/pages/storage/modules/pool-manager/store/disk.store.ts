import { Injectable, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { sortBy } from 'lodash-es';
import { Observable, tap } from 'rxjs';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
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

@UntilDestroy()
@Injectable()
export class DiskStore extends ComponentStore<DiskState> {
  private api = inject(ApiService);
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
