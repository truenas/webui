import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import {
  filter, mergeMap, switchMap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@Injectable()
export class EulaEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);

  /** Middleware arms the EULA on enterprise license upload; `is_eula_accepted` is the only gate needed. */
  checkEula$ = createEffect(() => this.actions$.pipe(
    ofType(adminUiInitialized),
    filterAsync(() => this.authService.hasRole([Role.FullAdmin])),
    mergeMap(() => {
      return this.api.call('truenas.is_eula_accepted').pipe(
        filter((isEulaAccepted) => !isEulaAccepted),
        switchMap(() => this.showEulaDialog()),
        this.errorHandler.withErrorHandler(),
      );
    }),
  ), { dispatch: false });

  private showEulaDialog(): Observable<void> {
    return forkJoin({
      eula: this.api.call('truenas.get_eula'),
      title: this.translate.get('End User License Agreement - TrueNAS'),
      buttonText: this.translate.get('I Agree'),
    }).pipe(
      switchMap(({ eula, title, buttonText }) => {
        return this.dialogService.confirm({
          title,
          message: ignoreTranslation(eula),
          hideCheckbox: true,
          buttonText,
          hideCancel: true,
        });
      }),
      filter(Boolean),
      switchMap(() => this.api.call('truenas.accept_eula')),
    );
  }
}
