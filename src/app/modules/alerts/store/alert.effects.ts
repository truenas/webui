import { Injectable, inject } from '@angular/core';
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
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

@Injectable()
export class AlertEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private store$ = inject<Store<AlertSlice>>(Store);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

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
    withLatestFrom(this.store$.select(selectUnreadAlerts)),
    mergeMap(([{ id }, unreadAlerts]) => {
      // Find the alert being dismissed
      const alert = unreadAlerts.find((a) => a.id === id);
      if (!alert) {
        return EMPTY;
      }

      // Find all alerts with the same key (duplicate instances)
      const alertsToDismiss = unreadAlerts.filter((a) => a.key === alert.key);
      const dismissRequests = alertsToDismiss.map((a) => this.api.call('alert.dismiss', [a.id]));

      return forkJoin(dismissRequests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          // Restore all alerts if dismiss fails
          alertsToDismiss.forEach((a) => {
            this.store$.dispatch(alertChanged({ alert: { id: a.id, dismissed: false } as Alert }));
          });
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });

  reopenAlert$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAlertPressed),
    withLatestFrom(this.store$.select(selectDismissedAlerts)),
    mergeMap(([{ id }, dismissedAlerts]) => {
      // Find the alert being reopened
      const alert = dismissedAlerts.find((a) => a.id === id);
      if (!alert) {
        return EMPTY;
      }

      // Find all alerts with the same key (duplicate instances)
      const alertsToReopen = dismissedAlerts.filter((a) => a.key === alert.key);
      const reopenRequests = alertsToReopen.map((a) => this.api.call('alert.restore', [a.id]));

      return forkJoin(reopenRequests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          // Restore dismissed state if reopen fails
          alertsToReopen.forEach((a) => {
            this.store$.dispatch(alertChanged({ alert: { id: a.id, dismissed: true } as Alert }));
          });
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });

  dismissAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAllAlertsPressed),
    withLatestFrom(this.store$.select(selectUnreadAlerts).pipe(pairwise())),
    mergeMap(([action, [unreadAlerts]]) => {
      // If specific alert IDs provided, only dismiss those; otherwise dismiss all
      const alertIds = action.alertIds;
      const alertsToDismiss = alertIds && alertIds.length > 0
        ? unreadAlerts.filter((alert) => alertIds.includes(alert.id))
        : unreadAlerts;
      const requests = alertsToDismiss.map((alert) => this.api.call('alert.dismiss', [alert.id]));
      return forkJoin(requests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertsDismissedChanged({ dismissed: false }));
          return of(EMPTY);
        }),
      );
    }),
    this.errorHandler.withErrorHandler(),
  ), { dispatch: false });

  reopenAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAllAlertsPressed),
    withLatestFrom(this.store$.select(selectDismissedAlerts).pipe(pairwise())),
    mergeMap(([action, [dismissedAlerts]]) => {
      // If specific alert IDs provided, only reopen those; otherwise reopen all
      const alertIds = action.alertIds;
      const alertsToReopen = alertIds && alertIds.length > 0
        ? dismissedAlerts.filter((alert) => alertIds.includes(alert.id))
        : dismissedAlerts;
      const requests = alertsToReopen.map((alert) => this.api.call('alert.restore', [alert.id]));
      return forkJoin(requests).pipe(
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.store$.dispatch(alertsDismissedChanged({ dismissed: true }));
          return of(EMPTY);
        }),
      );
    }),
  ), { dispatch: false });
}
