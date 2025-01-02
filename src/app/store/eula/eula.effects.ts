import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import {
  filter, mergeMap, switchMap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Injectable()
export class EulaEffects {
  checkEula$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    filterAsync(() => this.store$.select(selectIsEnterprise).pipe(filter(Boolean))),
    filterAsync(() => this.authService.hasRole([Role.FullAdmin])),
    mergeMap(() => {
      return this.api.call('truenas.is_eula_accepted').pipe(
        filter((isEulaAccepted) => !isEulaAccepted),
        switchMap(() => this.showEulaDialog()),
        this.errorHandler.catchError(),
      );
    }),
  ), { dispatch: false });

  private showEulaDialog(): Observable<void> {
    return this.api.call('truenas.get_eula').pipe(
      switchMap((eula) => {
        return this.dialogService.confirm({
          title: this.translate.instant('End User License Agreement - TrueNAS'),
          message: eula,
          hideCheckbox: true,
          buttonText: this.translate.instant('I Agree'),
          hideCancel: true,
        });
      }),
      filter(Boolean),
      switchMap(() => this.api.call('truenas.accept_eula')),
    );
  }

  constructor(
    private actions$: Actions,
    private api: ApiService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private authService: AuthService,
  ) { }
}
