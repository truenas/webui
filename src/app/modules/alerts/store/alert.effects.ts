import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { CallResponse } from '@truenas/api-client';
import {
  EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, map, mergeMap, pairwise, switchMap, tap, withLatestFrom,
} from 'rxjs/operators';
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
  alertDismissedReverted,
} from 'app/modules/alerts/store/alert.actions';
import {
  AlertSlice, selectDismissedAlerts, selectIsAlertPanelOpen, selectUnreadAlerts,
} from 'app/modules/alerts/store/alert.selectors';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { alertIndicatorPressed } from 'app/store/topbar/topbar.actions';

type AlertEntry = CallResponse<WebUiApiDirectory, 'alert.list'>[number];

/**
 * Middleware types `klass` and `level` as open strings the UI reads through its enums, and the
 * timestamps as strings although they arrive as `ApiTimestamp` envelopes.
 */
function toAlert(alert: AlertEntry): Alert {
  return alert as unknown as Alert;
}

type AlertCallResult = { id: string; ok: true } | { id: string; ok: false; error: unknown };

@Injectable()
export class AlertEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private store$ = inject<Store<AlertSlice>>(Store);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);

  loadAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, alertIndicatorPressed, alertReceivedWhenPanelIsOpen),
    switchMap(() => {
      return this.api.call('alert.list').pipe(
        map((alerts) => alertsLoaded({ alerts: alerts.map(toAlert) })),
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
                case (event.msg === 'added' || event.msg === 'changed') && isAlertsPanelOpen:
                  return of(alertReceivedWhenPanelIsOpen());
                case event.msg === 'added' && !isAlertsPanelOpen:
                  return of(alertAdded({ alert: toAlert(event.fields) }));
                case event.msg === 'changed' && !isAlertsPanelOpen:
                  return of(alertChanged({ alert: toAlert(event.fields) }));
                case event.msg === 'removed':
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
    mergeMap(({ ids }) => this.runPerIdRequests('alert.dismiss', ids, false)),
  ), { dispatch: false });

  reopenAlert$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAlertPressed),
    mergeMap(({ ids }) => this.runPerIdRequests('alert.restore', ids, true)),
  ), { dispatch: false });

  dismissAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(dismissAllAlertsPressed),
    withLatestFrom(this.store$.select(selectUnreadAlerts).pipe(pairwise())),
    mergeMap(([action, [unreadAlerts]]) => {
      const alertIds = action.alertIds;
      const alertsToDismiss = alertIds === undefined
        ? unreadAlerts
        : unreadAlerts.filter((alert) => alertIds.includes(alert.id));
      const ids = alertsToDismiss.map((alert) => alert.id);
      return this.runPerIdRequests('alert.dismiss', ids, false);
    }),
  ), { dispatch: false });

  reopenAllAlerts$ = createEffect(() => this.actions$.pipe(
    ofType(reopenAllAlertsPressed),
    withLatestFrom(this.store$.select(selectDismissedAlerts).pipe(pairwise())),
    mergeMap(([action, [dismissedAlerts]]) => {
      const alertIds = action.alertIds;
      const alertsToReopen = alertIds === undefined
        ? dismissedAlerts
        : dismissedAlerts.filter((alert: Alert) => alertIds.includes(alert.id));
      const ids = alertsToReopen.map((alert: Alert) => alert.id);
      return this.runPerIdRequests('alert.restore', ids, true);
    }),
  ), { dispatch: false });

  // Per-id error handling: only revert the ids whose server call failed, so a
  // partial failure doesn't roll back ids the backend has already accepted.
  private runPerIdRequests(
    method: 'alert.dismiss' | 'alert.restore',
    ids: string[],
    revertedDismissed: boolean,
  ): Observable<AlertCallResult[]> {
    if (ids.length === 0) {
      return EMPTY;
    }
    const requests: Observable<AlertCallResult>[] = ids.map((id) => this.callPerIdResult(method, id));
    return forkJoin(requests).pipe(
      tap((results) => this.handlePartialFailures(results, revertedDismissed)),
    );
  }

  private callPerIdResult(
    method: 'alert.dismiss' | 'alert.restore',
    id: string,
  ): Observable<AlertCallResult> {
    return this.api.call(method, [id]).pipe(
      map((): AlertCallResult => ({ id, ok: true })),
      catchError((error: unknown): Observable<AlertCallResult> => of({ id, ok: false, error })),
    );
  }

  private handlePartialFailures(
    results: AlertCallResult[],
    revertedDismissed: boolean,
  ): void {
    const failures = results.filter(
      (result): result is Extract<AlertCallResult, { ok: false }> => !result.ok,
    );
    if (failures.length === 0) {
      return;
    }
    this.errorHandler.showErrorModal(failures[0].error);
    failures.forEach(({ id }) => {
      this.store$.dispatch(alertDismissedReverted({ id, dismissed: revertedDismissed }));
    });
  }
}
