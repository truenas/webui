import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { ApiEventMessage } from 'app/enums/api-event-message.enum';
import {
  snapshotPageEntered, snapshotAdded, snapshotChanged, snapshotRemoved, snapshotsLoaded, snapshotsNotLoaded,
} from 'app/pages/storage/snapshots/store/snapshot.actions';
import { SnapshotSlice } from 'app/pages/storage/snapshots/store/snapshot.selectors';
import { WebSocketService } from 'app/services';

@Injectable()
export class SnapshotEffects {
  loadSnapshots$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotPageEntered),
    switchMap(({ extra }) => {
      return this.ws.call('zfs.snapshot.query', [
        [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
        { select: extra ? ['name', 'properties'] : ['name'], order_by: ['name'] },
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

  // TODO: Two types of subscription need to be refactored into one in WebSocketService.
  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => {
      return this.ws.subscribe('zfs.snapshot.query').pipe(
        filter((event) => !(event.msg === ApiEventMessage.Changed && event.cleared)),
        map((event) => {
          switch (event.msg) {
            case ApiEventMessage.Added:
              console.info('Added', event.fields);
              return snapshotAdded({ snapshot: event.fields });
            case ApiEventMessage.Changed:
              console.info('Changed', event.fields);
              return snapshotChanged({ snapshot: event.fields });
          }
        }),
      );
    }),
  ));

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => {
      return this.ws.sub('zfs.snapshot.query').pipe(
        filter((event) => event.msg === ApiEventMessage.Changed && event.cleared),
        map((event) => snapshotRemoved({ id: event.id })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<SnapshotSlice>,
    private translate: TranslateService,
  ) {}
}
