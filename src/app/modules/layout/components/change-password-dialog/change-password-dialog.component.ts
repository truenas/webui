import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import helptext from 'app/helptext/topbar';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
    ]],
  }, {
    validators: [
      matchOthersFgValidator(
        'passwordConfirmation',
        ['password'],
        this.translate.instant('New password and confirmation should match.'),
      ),
    ],
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
    const { currentPassword, password } = this.form.value;
    this.ws.call('auth.check_user', [this.loggedInUser.pw_name, currentPassword]).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
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
    ).subscribe(() => {
      this.snackbar.success(
        this.translate.instant(helptext.changePasswordDialog.pw_updated),
      );
      this.dialogRef.close();
    });
  }
}

