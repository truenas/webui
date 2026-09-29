import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  advancedConfigUpdated,
  generalConfigUpdated,
  systemConfigLoaded,
} from 'app/store/system-config/system-config.actions';

@Injectable()
export class SystemConfigEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private window = inject<Window>(WINDOW);

  loadConfig$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, generalConfigUpdated, advancedConfigUpdated),
    mergeMap(() => {
      return forkJoin([
        this.api.call('system.general.config'),
        this.api.call('system.advanced.config'),
      ]).pipe(
        map(([generalConfig, advancedConfig]) => {
          return systemConfigLoaded({
            generalConfig,
            // Middleware types `sed_user`, `sysloglevel` and the syslog transports as literal unions;
            // the UI's enums hold the same values.
            advancedConfig: advancedConfig as AdvancedConfig,
          });
        }),
        catchError((error: unknown) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));
}
