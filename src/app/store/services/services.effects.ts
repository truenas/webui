import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  mergeMap, map, switchMap, filter, EMPTY, catchError, of, take, Observable,
} from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { AuthService } from 'app/modules/auth/auth.service';
import { StartServiceDialog, StartServiceDialogResult } from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServicesService } from 'app/services/services.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  checkIfServiceIsEnabled, serviceChanged, serviceDisabled, serviceStartFailed, serviceStarted, servicesLoaded,
} from 'app/store/services/services.actions';
import { selectService } from 'app/store/services/services.selectors';
import { serviceEnabled } from './services.actions';

@Injectable()
export class ServicesEffects {
  private store$ = inject<Store<AppState>>(Store);
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private matDialog = inject(MatDialog);
  private authService = inject(AuthService);
  private servicesService = inject(ServicesService);

  loadServices$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.api.call('service.query', [[], { order_by: ['service'] }]).pipe(
        map((services) => servicesLoaded({ services })),
        catchError((error: unknown) => {
          // TODO: Basically a fatal error. Handle it.
          console.error(error);
          return EMPTY;
        }),
      );
    }),
  ));

  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(servicesLoaded),
    switchMap(() => {
      return this.api.subscribe('service.query').pipe(
        map((event) => event.fields),
        map((service) => serviceChanged({ service })),
      );
    }),
  ));

  checkIfServiceIsEnabled$ = createEffect(() => this.actions$.pipe(
    ofType(checkIfServiceIsEnabled),
    filter(({ serviceName }) => Boolean(serviceName)),
    filterAsync(({ serviceName }) => this.canUserManageService(serviceName)),
    switchMap(({ serviceName }) => {
      return this.store$.select(selectService(serviceName)).pipe(take(1), filter((service) => !!service));
    }),
    switchMap((service) => {
      if (service.state === ServiceStatus.Stopped) {
        return this.matDialog.open<StartServiceDialog, unknown, StartServiceDialogResult>(
          StartServiceDialog,
          {
            data: service.service,
            disableClose: true,
          },
        )
          .afterClosed()
          .pipe(
            filter((data) => !!data),
            map((data) => {
              if (data.start && data.startAutomatically) {
                return serviceEnabled();
              }
              if (data.start && !data.startAutomatically) {
                return serviceStarted();
              }
              return data.startAutomatically ? serviceEnabled() : serviceDisabled();
            }),
            catchError(() => of(serviceStartFailed())),
          );
      }

      if (service.enable) {
        return of(serviceEnabled());
      }

      return of(serviceStarted());
    }),
  ));

  private canUserManageService(serviceName: ServiceName): Observable<boolean> {
    const requiredRoles = this.servicesService.getRolesRequiredToManage(serviceName);
    return this.authService.hasRole(requiredRoles);
  }
}
