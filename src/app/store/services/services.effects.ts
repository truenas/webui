import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, map, switchMap, filter, EMPTY, catchError, of, distinctUntilChanged } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { StartServiceDialogComponent } from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { checkIfServiceIsEnabled, serviceChanged, serviceStartFailed, servicesLoaded } from 'app/store/services/services.actions';
import { selectService } from 'app/store/services/services.selectors';
import { serviceEnabled } from './services.actions';

const hiddenServices: ServiceName[] = [ServiceName.Gluster, ServiceName.Afp];

@Injectable()
export class ServicesEffects {
  loadServices$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    mergeMap(() => {
      return this.ws.call('service.query', [[], { order_by: ['service'] }]).pipe(
        map((services) => services.filter((service) => !hiddenServices.includes(service.service))),
        map((services) => servicesLoaded({ services })),
        catchError((error) => {
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
      return this.ws.subscribe('service.query').pipe(
        map((event) => event.fields),
        filter((service) => !hiddenServices.includes(service.service)),
        switchMap((service) => of(serviceChanged({ service }))),
      );
    }),
  ));

  checkIfServiceIsEnabled$ = createEffect(() => this.actions$.pipe(
    ofType(checkIfServiceIsEnabled),
    filter(({ serviceName }) => Boolean(serviceName)),
    switchMap(({ serviceName }) => this.store$.select(selectService(serviceName))),
    distinctUntilChanged((prev, curr) => prev.id === curr.id),
    switchMap((service) => {
      if (!service.enable || service.state === ServiceStatus.Stopped) {
        return this.matDialog.open(StartServiceDialogComponent, {
          data: service.service,
          disableClose: true,
        }).afterClosed().pipe(
          filter(Boolean),
          map(() => serviceEnabled()),
          catchError(() => of(serviceStartFailed())),
        );
      }

      return of(serviceEnabled());
    }),
  ));

  constructor(
    private store$: Store<AppState>,
    private actions$: Actions,
    private ws: WebSocketService,
    private matDialog: MatDialog,
  ) {}
}
