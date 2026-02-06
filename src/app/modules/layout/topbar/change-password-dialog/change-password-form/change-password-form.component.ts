import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
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
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-change-password-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private loader = inject(LoaderService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

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
    password: helptextTopbar.changePasswordDialog.newPasswordTooltip,
  };

  get isFullAdminUser$(): Observable<boolean> {
    return this.authService.hasRole(Role.FullAdmin);
  }

  constructor() {
    this.authService.user$.pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.snackbar.success(
          this.translate.instant(helptextTopbar.changePasswordDialog.passwordUpdated),
        );

        this.passwordUpdated.emit();
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
