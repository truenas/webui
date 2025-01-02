import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, merge } from 'rxjs';
import {
  filter, map, mergeMap, switchMap, tap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
    filterAsync(() => this.authService.hasRole([Role.NetworkInterfaceWrite])),
    mergeMap(() => {
      return forkJoin([
        this.api.call('interface.has_pending_changes'),
        this.api.call('interface.checkin_waiting'),
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
        title: this.translate.instant(helptextInterfaces.checkin_title),
        message: this.translate.instant(helptextInterfaces.pending_checkin_dialog_text),
        hideCheckbox: true,
        buttonText: this.translate.instant(helptextInterfaces.go_to_network),
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
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private authService: AuthService,
  ) { }
}
