import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-change-password-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TranslateModule,
    TestDirective,
    AsyncPipe,
  ],
})
export class ChangePasswordFormComponent {
  readonly passwordUpdated = output();

  form = this.fb.nonNullable.group({
    old_password: [''],
    new_password: ['', [Validators.required]],
    passwordConfirmation: ['', [Validators.required]],
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

  get isFullAdminUser$(): Observable<boolean> {
    return this.authService.hasRole(Role.FullAdmin);
  }

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private api: ApiService,
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
    this.api.call('user.set_password', [{
      old_password: this.form.getRawValue().old_password,
      new_password: this.form.getRawValue().new_password,
      username: this.loggedInUser.pw_name,
    }]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(
          this.translate.instant(helptextTopbar.changePasswordDialog.pw_updated),
        );

        this.passwordUpdated.emit();
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
