import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, forkJoin, of } from 'rxjs';
import {
  catchError, map, mergeMap, switchMap,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
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
  private window = inject<Window>(WINDOW);

  loadConfig$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, generalConfigUpdated, advancedConfigUpdated),
    mergeMap(() => {
      return forkJoin([
        this.api.call('system.general.config'),
        this.api.call('system.advanced.config'),
      ]).pipe(
        switchMap(([generalConfig, advancedConfig]) => {
          const uiCertificate = generalConfig.ui_certificate as unknown;

          if (typeof uiCertificate !== 'number') {
            return of([generalConfig, advancedConfig] as const);
          }

          return this.api.call('system.general.ui_certificate_choices').pipe(
            map((certificateChoices) => [
              this.normalizeUiCertificate(generalConfig, uiCertificate, certificateChoices),
              advancedConfig,
            ] as const),
          );
        }),
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

  private normalizeUiCertificate(
    generalConfig: SystemGeneralConfig,
    certificateId: number,
    certificateChoices: Choices,
  ): SystemGeneralConfig {
    return {
      ...generalConfig,
      ui_certificate: {
        id: certificateId,
        name: certificateChoices[certificateId] || String(certificateId),
      } as Certificate,
    };
  }
}
