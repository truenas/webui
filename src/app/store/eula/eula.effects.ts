import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, mergeMap, switchMap } from 'rxjs/operators';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@Injectable()
export class EulaEffects {
  checkEula$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    filter(() => this.systemGeneralService.isEnterprise),
    mergeMap(() => {
      return this.ws.call('truenas.is_eula_accepted').pipe(
        filter((isEulaAccepted) => !isEulaAccepted),
        switchMap(() => this.showEulaDialog()),
        this.errorHandler.catchError(),
      );
    }),
  ), { dispatch: false });

  private showEulaDialog(): Observable<void> {
    return this.ws.call('truenas.get_eula').pipe(
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
      switchMap(() => this.ws.call('truenas.accept_eula')),
    );
  }

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private systemGeneralService: SystemGeneralService,
  ) { }
}
