import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, merge } from 'rxjs';
import { filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import {
  checkinIndicatorPressed,
  networkInterfacesChanged,
  networkInterfacesCheckinLoaded,
} from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Injectable()
export class NetworkInterfacesEffects {
  loadCheckinStatus$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized, networkInterfacesChanged),
    mergeMap(() => {
      return forkJoin([
        this.ws.call('interface.has_pending_changes'),
        this.ws.call('interface.checkin_waiting'),
      ]).pipe(
        this.errorHandler.catchError(),
        map(([hasPendingChanges, checkinWaiting]) => {
          return networkInterfacesCheckinLoaded({ hasPendingChanges, checkinWaiting });
        }),
      );
    }),
  ));

  showCheckinPrompt$ = createEffect(() => merge(
    this.actions$.pipe(
      ofType(networkInterfacesCheckinLoaded),
      filter(({ hasPendingChanges, checkinWaiting }) => {
        return hasPendingChanges && Boolean(checkinWaiting);
      }),
    ),
    this.actions$.pipe(ofType(checkinIndicatorPressed)),
  ).pipe(
    filter(() => this.router.url !== '/network'),
    switchMap(() => {
      return this.dialogService.confirm({
        title: this.translate.instant(network_interfaces_helptext.checkin_title),
        message: this.translate.instant(network_interfaces_helptext.pending_checkin_dialog_text),
        hideCheckbox: true,
        buttonText: this.translate.instant(network_interfaces_helptext.go_to_network),
      }).pipe(
        filter(Boolean),
        tap(() => {
          this.router.navigate(['/network']);
        }),
      );
    }),
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private router: Router,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogService: DialogService,
  ) { }
}
