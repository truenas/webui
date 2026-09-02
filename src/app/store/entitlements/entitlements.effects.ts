import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ApiService } from 'app/modules/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { entitlementsLoaded, entitlementsLoadFailed } from 'app/store/entitlements/entitlements.actions';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

@Injectable()
export class EntitlementsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);

  loadEntitlements = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, systemInfoUpdated),
    mergeMap(() => {
      return this.api.call('truenas.entitlements.info').pipe(
        map((info) => entitlementsLoaded({ entitlements: info.features })),
        catchError((error: unknown) => {
          console.error(error);
          return of(entitlementsLoadFailed());
        }),
      );
    }),
  ));
}
