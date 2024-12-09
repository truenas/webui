import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, forkJoin, of,
} from 'rxjs';
import {
  catchError, map, mergeMap, pairwise, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { Alert } from 'app/interfaces/alert.interface';
import {
  dismissAlertPressed, dismissAllAlertsPressed,
  reopenAlertPressed,
  reopenAllAlertsPressed,
  alertRemoved,
  alertsNotLoaded,
  alertReceivedWhenPanelIsOpen,
  alertAdded,
  alertsLoaded,
  alertChanged,
  alertsDismissedChanged,
} from 'app/modules/alerts/store/alert.actions';
import {
  AlertSlice, selectDismissedAlerts, selectIsAlertPanelOpen, selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

@Injectable()
export class AlertEffects {
  loadAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, alertIndicatorPressed, alertReceivedWhenPanelIsOpen),
    switchMap(() => {
      return this.api.call('alert.list').pipe(
        map((alerts) => alertsLoaded({ alerts })),
        catchError((error: unknown) => {
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
      return this.api.subscribe('alert.list').pipe(
        switchMap((event) => {
          return this.store$.select(selectIsAlertPanelOpen).pipe(
            switchMap((isAlertsPanelOpen) => {
              switch (true) {
                case [
                  CollectionChangeType.Added, CollectionChangeType.Changed,
                ].includes(event.msg) && isAlertsPanelOpen:
                  return of(alertReceivedWhenPanelIsOpen());
                case event.msg === CollectionChangeType.Added && !isAlertsPanelOpen:
                  return of(alertAdded({ alert: event.fields }));
                case event.msg === CollectionChangeType.Changed && !isAlertsPanelOpen:
                  return of(alertChanged({ alert: event.fields }));
                case event.msg === CollectionChangeType.Removed:
                  return of(alertRemoved({ id: event.id.toString() }));
                default:
                  return EMPTY;
              }
            }),
          );
        }),
      );
    }),
  ));

  // TODO: Action errors are not handled. Standardize on how to report on errors and show them.
  dismissAlert$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAlertPressed),
    mergeMap(({ id }) => {
      return this.api.call('alert.dismiss', [id]).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertChanged({ alert: { id, dismissed: false } as Alert }));
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });

  reopenAlert$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAlertPressed),
    mergeMap(({ id }) => {
      return this.api.call('alert.restore', [id]).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertChanged({ alert: { id, dismissed: true } as Alert }));
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });

  dismissAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAllAlertsPressed),
    withLatestFrom(this.store$.select(selectUnreadAlerts).pipe(pairwise())),
    mergeMap(([, [unreadAlerts]]) => {
      const requests = unreadAlerts.map((alert) => this.api.call('alert.dismiss', [alert.id]));
      return forkJoin(requests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertsDismissedChanged({ dismissed: false }));
          return of(EMPTY);
        }),
      );
    }),
    this.errorHandler.catchError(),
  ), { dispatch: false });

  reopenAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAllAlertsPressed),
    withLatestFrom(this.store$.select(selectDismissedAlerts).pipe(pairwise())),
    mergeMap(([, [dismissedAlerts]]) => {
      const requests = dismissedAlerts.map((alert) => this.api.call('alert.restore', [alert.id]));
      return forkJoin(requests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertsDismissedChanged({ dismissed: true }));
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private store$: Store<AlertSlice>,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {}
}
