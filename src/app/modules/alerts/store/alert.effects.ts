import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, forkJoin, of } from 'rxjs';
import {
  catchError, filter, map, mergeMap, pairwise, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import {
  dismissAlertPressed, dismissAllAlertsPressed,
  reopenAlertPressed,
  reopenAllAlertsPressed,
  alertAdded,
  alertChanged,
  alertRemoved,
  alertsLoaded,
  alertsNotLoaded,
} from 'app/modules/alerts/store/alert.actions';
import { AlertSlice, selectDismissedAlerts, selectUnreadAlerts } from 'app/modules/alerts/store/alert.selectors';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@Injectable()
export class AlertEffects {
  loadAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    switchMap(() => {
      return this.ws.call('alert.list').pipe(
        map((alerts) => alertsLoaded({ alerts })),
        catchError((error) => {
          console.error(error);
          // TODO: See if it would make sense to parse middleware error.
          return of(alertsNotLoaded({
            error: this.translate.instant('Alerts could not be loaded'),
          }));
        }),
      );
    }),
  ));

  subscribeToUpdates$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    switchMap(() => {
      return this.ws.subscribe('alert.list').pipe(
        filter((event) => event.msg !== IncomingApiMessageType.Removed),
        switchMap((event) => {
          switch (event.msg) {
            case IncomingApiMessageType.Added:
              return of(alertAdded({ alert: event.fields }));
            case IncomingApiMessageType.Changed:
              return of(alertChanged({ alert: event.fields }));
            default:
              return EMPTY;
          }
        }),
      );
    }),
  ));

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    switchMap(() => {
      return this.ws.subscribe('alert.list').pipe(
        filter((event) => event.msg === IncomingApiMessageType.Removed),
        map((event) => alertRemoved({ id: event.id.toString() })),
      );
    }),
  ));

  // TODO: Action errors are not handled. Standartize on how to report on errors and show them.
  dismissAlert$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAlertPressed),
    mergeMap(({ id }) => {
      return this.ws.call('alert.dismiss', [id]);
    }),
  ), { dispatch: false });

  reopenAlert$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAlertPressed),
    mergeMap(({ id }) => {
      return this.ws.call('alert.restore', [id]);
    }),
  ), { dispatch: false });

  dismissAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAllAlertsPressed),
    withLatestFrom(this.store$.select(selectUnreadAlerts).pipe(pairwise())),
    mergeMap(([, [unreadAlerts]]) => {
      const requests = unreadAlerts.map((alert) => this.ws.call('alert.dismiss', [alert.id]));
      return forkJoin(requests);
    }),
  ), { dispatch: false });

  reopenAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAllAlertsPressed),
    withLatestFrom(this.store$.select(selectDismissedAlerts).pipe(pairwise())),
    mergeMap(([, [dismissedAlerts]]) => {
      const requests = dismissedAlerts.map((alert) => this.ws.call('alert.restore', [alert.id]));
      return forkJoin(requests);
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<AlertSlice>,
    private translate: TranslateService,
  ) {}
}
