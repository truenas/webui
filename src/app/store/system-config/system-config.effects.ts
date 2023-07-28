import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  advancedConfigUpdated,
  generalConfigUpdated,
  systemConfigLoaded,
} from 'app/store/system-config/system-config.actions';

@Injectable()
export class SystemConfigEffects {
  loadConfig$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, generalConfigUpdated, advancedConfigUpdated),
    mergeMap(() => {
      return forkJoin([
        this.ws.call('system.general.config'),
        this.ws.call('system.advanced.config'),
      ]).pipe(
        map(([generalConfig, advancedConfig]) => {
          this.window.localStorage.setItem('language', generalConfig.language);
          return systemConfigLoaded({ generalConfig, advancedConfig });
        }),
        catchError((error) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) {}
}
