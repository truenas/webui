import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap, map, switchMap, filter, EMPTY, catchError, of } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { serviceChanged, servicesLoaded } from 'app/store/services/services.actions';

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

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
  ) {}
}
