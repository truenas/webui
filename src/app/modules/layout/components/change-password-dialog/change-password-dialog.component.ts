import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { helptextTopbar } from 'app/helptext/topbar';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/ix-forms/validators/password-validation/password-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AuthService } from 'app/services/auth/auth.service';
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
    old_password: ['', [Validators.required]],
    new_password: ['', [Validators.required]],
    passwordConfirmation: ['', [
      Validators.required,
    ]],
  }, {
    validators: [
      matchOthersFgValidator(
        'passwordConfirmation',
        ['new_password'],
        this.translate.instant('New password and confirmation should match.'),
      ),
    ],
  });

  private loggedInUser: LoggedInUser;

  readonly tooltips = {
    password: helptextTopbar.changePasswordDialog.pw_new_pw_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private authService: AuthService,
    private loader: AppLoaderService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
  ) {
    this.authService.user$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((user) => {
      this.loggedInUser = user;
    });
  }

  onSubmit(): void {
    this.ws.call('user.set_password', [{
      old_password: this.form.value.old_password,
      new_password: this.form.value.new_password,
      username: this.loggedInUser.pw_name,
    }]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(
          this.translate.instant(helptextTopbar.changePasswordDialog.pw_updated),
        );
        this.dialogRef.close();
      },
      error: (error) => {
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
