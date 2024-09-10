import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { sortBy } from 'lodash-es';
import { Observable, tap } from 'rxjs';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  loadDisks(): Observable<DiskDetailsResponse> {
    return this.ws.call('disk.details').pipe(
      this.errorHandler.catchError(),
      tap((diskResponse) => {
        this.patchState({
          unusedDisks: diskResponse.unused,
          usedDisks: diskResponse.used,
        });
      }),
    );
  }
}
