import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin, tap } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { waitForConsent$ } from 'app/services/errors/wait-for-sentry-consent';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  advancedConfigUpdated,
  generalConfigUpdated,
  systemConfigLoaded,
} from 'app/store/system-config/system-config.actions';

@Injectable()
export class SystemConfigEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private window = inject<Window>(WINDOW);

  loadConfig$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, generalConfigUpdated, advancedConfigUpdated),
    mergeMap(() => {
      return forkJoin([
        this.api.call('system.general.config'),
        this.api.call('system.advanced.config'),
      ]).pipe(
        map(([generalConfig, advancedConfig]) => {
          return systemConfigLoaded({ generalConfig, advancedConfig });
        }),
        catchError((error: unknown) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));

  disableSentryIfNeeded$ = createEffect(() => this.actions$.pipe(
    ofType(systemConfigLoaded),
    tap(({ generalConfig }) => {
      if (!generalConfig.usage_collection) {
        this.errorHandler.disableSentry();
      }

      waitForConsent$.next(generalConfig.usage_collection);
    }),
  ), { dispatch: false });
}
