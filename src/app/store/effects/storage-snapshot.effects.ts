import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import {
  switchMap, map, tap, catchError,
} from 'rxjs/operators';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { StorageService, WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import {
  SnapshotLoadAction, SnapshotActionType, SnapshotLoadFailAction, SnapshotLoadSuccessAction,
} from 'app/store/actions/storage-snapshot.actions';
import { ZfsSnapshot } from '../../interfaces/zfs-snapshot.interface';
import { SnapshotListRow } from '../../pages/storage/snapshots/snapshot-list/snapshot-list-row.interface';

@Injectable()
export class SnapshotEffects {
  constructor(
    private ws: WebSocketService,
    private storageService: StorageService,
    private localeService: LocaleService,
    private actions$: Actions,
  ) { }

  loadSnapshots$ = createEffect(() => {
    return this.actions$
      .pipe(ofType<SnapshotLoadAction>(SnapshotActionType.Loading),
        map((action) => action.payload),
        tap((action) => { console.info(action); }),
        switchMap((params: QueryParams<ZfsSnapshot>) => {
          return this.ws.call('zfs.snapshot.query', params);
        }),
        map((response: ZfsSnapshot[]) => {
          return response.map((row) => {
            const [datasetName, snapshotName] = row.name.split('@');

            const transformedRow = {
              id: row.name,
              dataset: datasetName,
              snapshot: snapshotName,
              properties: row.properties,
              name: row.name,
            } as SnapshotListRow;

            if (row.properties) {
              transformedRow.used = this.storageService.convertBytestoHumanReadable(row.properties.used.rawvalue);
              transformedRow.created = this.localeService.formatDateTime(row.properties.creation.parsed.$date);
              transformedRow.referenced = this.storageService.convertBytestoHumanReadable(
                row.properties.referenced.rawvalue,
              );
            }

            return transformedRow;
          });
        }),
        map((snapshots: SnapshotListRow[]) => new SnapshotLoadSuccessAction(snapshots)),
        catchError((error) => of(new SnapshotLoadFailAction(error))));
  });
}
