import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SigninStore } from 'app/pages/signin/store/signin.store';

const adminUsername = 'truenas_admin';

@Component({
  selector: 'ix-set-admin-password-form',
  templateUrl: './set-admin-password-form.component.html',
  styleUrls: ['./set-admin-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButton,
    TranslateModule,
    IxInputComponent,
    TestDirective,
  ],
})
export class SetAdminPasswordFormComponent {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private errorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private signinStore = inject(SigninStore);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = toSignal(this.signinStore.isLoading$, { initialValue: false });

  /**
   * True from the moment the form is submitted until the store leaves its loading state - either
   * because the setup or login failed, or because the card took over with "Logging in...".
   * Derived rather than cleared by hand so no failure path can leave the button mid-flight.
   */
  private hasSubmitted = signal(false);
  protected isSubmitting = computed(() => this.hasSubmitted() && this.isLoading());

  form = this.formBuilder.nonNullable.group({
    username: [adminUsername, Validators.required],
    password: ['', Validators.required],
    password2: ['', [
      Validators.required,
    ]],
  }, {
    validators: [
      matchOthersFgValidator(
        'password2',
        ['password'],
        this.translate.instant('Passwords do not match'),
      ),
    ],
  });

  protected onSubmit(): void {
    const { username, password } = this.form.getRawValue();
    this.signinStore.setLoadingState(true);
    this.hasSubmitted.set(true);

    const request$ = this.api.call('user.setup_local_administrator', [username, password]);

    request$.pipe(
      switchMap(() => this.authService.login(username, password)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ loginResult }) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
          return;
        }

        this.signinStore.setLoadingState(false);
        this.snackbar.error(this.translate.instant('Login error. Please try again.'));
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }
}
