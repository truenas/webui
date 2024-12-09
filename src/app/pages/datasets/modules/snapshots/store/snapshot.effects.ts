import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { snapshotExcludeBootQueryFilter } from 'app/pages/datasets/modules/snapshots/constants/snapshot-exclude-boot.constant';
import {
  snapshotAdded, snapshotChanged,
  snapshotPageEntered,
  snapshotRemoved, snapshotsLoaded, snapshotsNotLoaded,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable()
export class SnapshotEffects {
  loadSnapshots$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotPageEntered),
    switchMap(() => this.store$.pipe(waitForPreferences)),
    switchMap((preferences) => {
      const extraColumns = preferences.showSnapshotExtraColumns ? ['properties' as keyof ZfsSnapshot] : [];
      return this.api.call('zfs.snapshot.query', [
        snapshotExcludeBootQueryFilter as QueryFilters<ZfsSnapshot>,
        {
          select: ['snapshot_name', 'dataset', 'name', ...extraColumns],
          order_by: ['name'],
        },
      ]).pipe(
        map((snapshots) => snapshotsLoaded({ snapshots })),
        catchError((error: unknown) => {
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
      return this.api.subscribe('zfs.snapshot.query').pipe(
        filter((event) => event.msg !== CollectionChangeType.Removed),
        switchMap((event) => {
          switch (event.msg) {
            case CollectionChangeType.Added:
              return of(snapshotAdded({ snapshot: event.fields }));
            case CollectionChangeType.Changed:
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
      return this.api.subscribe('zfs.snapshot.query').pipe(
        filter((event) => event.msg === CollectionChangeType.Removed),
        map((event) => snapshotRemoved({ id: event.id.toString() })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}
}
