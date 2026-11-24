import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, interval, Observable, of,
} from 'rxjs';
import {
  catchError, exhaustMap, filter, map, switchMap, take, takeUntil,
} from 'rxjs/operators';
import {
  toLegacyHolds, ZfsResourceSnapshot, ZfsSnapshot, zfsResourceToSnapshot,
} from 'app/interfaces/zfs-snapshot.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  snapshotAdded, snapshotChanged,
  snapshotPageEntered,
  snapshotPageLeft,
  snapshotRemoved, snapshotsLoaded, snapshotsNotLoaded, snapshotsRefreshed,
} from 'app/pages/datasets/modules/snapshots/store/snapshot.actions';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

/**
 * Snapshots made by periodic snapshot tasks, replication or the CLI send no `zfs.resource.snapshot.list` ADDED event,
 * so the list is read again this often while it is open and the tab is visible.
 */
export const snapshotRefreshIntervalMs = 60_000;

/**
 * The same re-read when the extra columns are on. It then also reads `creation`, `used` and `referenced` for every
 * snapshot, the query the UI warns is slow, so it runs less often.
 */
export const snapshotRefreshWithPropertiesIntervalMs = 300_000;

@Injectable()
export class SnapshotEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);

  private pageLeft$ = this.actions$.pipe(ofType(snapshotPageLeft));

  loadSnapshots$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotPageEntered),
    switchMap(() => this.listSnapshots().pipe(
      map((snapshots) => snapshotsLoaded({ snapshots })),
      catchError((error: unknown) => {
        console.error(error);
        // TODO: See if it would make sense to parse middleware error.
        return of(snapshotsNotLoaded({
          error: this.translate.instant('Snapshots could not be loaded'),
        }));
      }),
      // Leaving before the list answers must not start the re-read and the subscription for a closed page.
      takeUntil(this.pageLeft$),
    )),
  ));

  refreshSnapshots$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => this.store$.pipe(waitForPreferences, take(1))),
    switchMap((preferences) => interval(
      preferences.showSnapshotExtraColumns ? snapshotRefreshWithPropertiesIntervalMs : snapshotRefreshIntervalMs,
    ).pipe(
      // A hidden tab catches up on the next tick after it is shown again.
      filter(() => !this.document.hidden),
      exhaustMap(() => this.listSnapshots().pipe(
        map((snapshots) => snapshotsRefreshed({ snapshots })),
        catchError((error: unknown) => {
          // The next tick tries again; the list keeps what it has meanwhile.
          console.error(error);
          return EMPTY;
        }),
      )),
      takeUntil(this.pageLeft$),
    )),
  ));

  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(snapshotsLoaded),
    switchMap(() => {
      return this.api.subscribe('zfs.resource.snapshot.list').pipe(
        map((event) => {
          switch (event.msg) {
            case 'added':
              return snapshotAdded({ snapshot: zfsResourceToSnapshot(event.fields as ZfsResourceSnapshot) });
            case 'changed':
              // A CHANGED event carries only the holds, after a hold or release.
              return snapshotChanged({ id: event.id, changes: { holds: toLegacyHolds(event.fields.holds) } });
            case 'removed':
            default:
              return snapshotRemoved({ id: event.id });
          }
        }),
        takeUntil(this.pageLeft$),
      );
    }),
  ));

  /** Every snapshot on the system, with the extra columns' properties when the user has them on. */
  private listSnapshots(): Observable<ZfsSnapshot[]> {
    return this.store$.pipe(
      waitForPreferences,
      take(1),
      switchMap((preferences) => this.api.call('zfs.resource.snapshot.list', [{
        recursive: true,
        properties: preferences.showSnapshotExtraColumns ? ['creation', 'used', 'referenced'] : null,
      }])),
      map((snapshots) => snapshots.map(zfsResourceToSnapshot)),
    );
  }
}
