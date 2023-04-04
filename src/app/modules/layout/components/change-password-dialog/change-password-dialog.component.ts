import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import helptext from 'app/helptext/topbar';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    password: ['', [Validators.required]],
    passwordConfirmation: ['', [
      Validators.required,
      this.validatorsService.withMessage(
        matchOtherValidator('password'),
        this.translate.instant('New password and confirmation should match.'),
      ),
    ]],
  });

  private loggedInUser: LoggedInUser;

  readonly tooltips = {
    password: helptext.changePasswordDialog.pw_new_pw_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private authService: AuthService,
    private loader: AppLoaderService,
    private validatorsService: IxValidatorsService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
  ) {
    this.authService.user$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((user) => {
      this.loggedInUser = user;
    });
  }

  onSubmit(): void {
    this.loader.open();
    const { currentPassword, password } = this.form.value;
    this.ws.call('auth.check_user', [this.loggedInUser.pw_name, currentPassword]).pipe(
      tap((passwordVerified) => {
        if (passwordVerified) {
          return;
        }

        this.dialogService.warn(
          helptext.changePasswordDialog.pw_invalid_title,
          helptext.changePasswordDialog.pw_invalid_title,
        );
        this.loader.close();
      }),
      filter(Boolean),
      switchMap(() => this.ws.call('user.update', [this.loggedInUser.id, { password }])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(
          this.translate.instant(helptext.changePasswordDialog.pw_updated),
        );
        this.loader.close();
        this.dialogRef.close();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
