import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { snapshotExcludeBootQueryFilter } from 'app/pages/datasets/modules/snapshots/constants/snapshot-exclude-boot.constant';
import {
  snapshotAdded, snapshotChanged,
  snapshotPageEntered,
  snapshotRemoved, snapshotsLoaded, snapshotsNotLoaded,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable()
export class SnapshotEffects {
  loadSnapshots$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotPageEntered),
    switchMap(() => this.store$.pipe(waitForPreferences)),
    switchMap((preferences) => {
      const extraColumns = preferences.showSnapshotExtraColumns ? ['properties' as keyof ZfsSnapshot] : [];
      return this.ws.call('zfs.snapshot.query', [
        snapshotExcludeBootQueryFilter as QueryFilters<ZfsSnapshot>,
        {
          select: ['snapshot_name', 'dataset', 'name', ...extraColumns],
          order_by: ['name'],
        },
      ]).pipe(
        map((snapshots) => snapshotsLoaded({ snapshots })),
        catchError((error) => {
          console.error(error);
          // TODO: See if it would make sense to parse middleware error.
          return of(snapshotsNotLoaded({
            error: this.translate.instant('Snapshots could not be loaded'),
          }));
        }),
      );
    }),
  ));

  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => {
      return this.ws.subscribe('zfs.snapshot.query').pipe(
        filter((event) => event.msg !== IncomingApiMessageType.Removed),
        switchMap((event) => {
          switch (event.msg) {
            case IncomingApiMessageType.Added:
              return of(snapshotAdded({ snapshot: event.fields }));
            case IncomingApiMessageType.Changed:
              return of(snapshotChanged({ snapshot: event.fields }));
            default:
              return EMPTY;
          }
        }),
      );
    }),
  ));

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => {
      return this.ws.subscribe('zfs.snapshot.query').pipe(
        filter((event) => event.msg === IncomingApiMessageType.Removed),
        map((event) => snapshotRemoved({ id: event.id.toString() })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}
}
