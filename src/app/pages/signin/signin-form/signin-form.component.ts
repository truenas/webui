import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Validators, FormsModule, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnBannerComponent, TnButtonComponent, TnFormFieldComponent, TnInputComponent, tnIconMarker,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  distinctUntilChanged, firstValueFrom,
} from 'rxjs';
import {
  filter, take,
} from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExResponse, LoginRedirectResponse } from 'app/interfaces/auth.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { SigninStore } from 'app/pages/signin/store/signin.store';

@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TnBannerComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class SigninFormComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private signinStore = inject(SigninStore);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  disabled = input.required<boolean>();

  protected hasTwoFactor = signal(false);
  protected showSecurityWarning = signal(false);

  protected isLastLoginAttemptFailed = signal(false);
  protected isLastOtpAttemptFailed = signal(false);
  protected lastLoginError = signal<TranslatedString | null>(null);

  protected isPasswordVisible = signal(false);

  protected readonly tnIconMarker = tnIconMarker;
  protected readonly InputType = InputType;

  form = this.formBuilder.group({
    username: [''],
    password: [''],
    otp: ['', Validators.required],
  });

  protected isLoading = toSignal(this.signinStore.isLoading$);
  readonly isFormDisabled = computed(() => this.disabled() || this.isLoading());

  protected readonly otpErrorMessages = {
    required: this.translate.instant('{field} is required', {
      field: this.translate.instant('Two-Factor Authentication Code'),
    }),
  };

  constructor() {
    effect(() => {
      if (this.isFormDisabled()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    if (this.window.location.protocol !== 'https:') {
      this.showSecurityWarning.set(true);
    }

    this.signinStore.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        performance.mark('Login page ready');
        performance.measure('Getting to login page', 'index.html', 'Login page ready');
      },
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(
      distinctUntilChanged(isEqual),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isLastLoginAttemptFailed.set(false);
        this.isLastOtpAttemptFailed.set(false);
      },
    });
  }

  protected async login(event?: Event): Promise<void> {
    event?.preventDefault();
    if (await firstValueFrom(this.signinStore.isLoading$)) {
      return;
    }
    performance.mark('Login Start');
    this.isLastLoginAttemptFailed.set(false);
    this.signinStore.setLoadingState(true);
    const formValues = this.form.getRawValue();
    this.authService.login(formValues.username, formValues.password).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ loginResult, loginResponse }) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.signinStore.setLoadingState(false);
          this.handleFailedLogin(loginResult, loginResponse);
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  protected handleFailedLogin(loginResult: LoginResult, loginResponse: LoginExResponse): void {
    this.isLastLoginAttemptFailed.set(true);

    if (loginResult === LoginResult.NoOtp) {
      this.hasTwoFactor.set(true);
      this.form.controls.password.setValue('');
      return;
    }

    if (loginResult === LoginResult.Redirect) {
      const links = (loginResponse as LoginRedirectResponse).urls.map((url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }).join(', ');

      this.lastLoginError.set(this.translate.instant(
        'Logging in at the current URL is not possible.<br>To login, please navigate to: {links}',
        { links },
      ));
      this.snackbar.error(this.translate.instant('Logging in at the current URL is not possible.'));

      return;
    }

    const errorMessage = this.signinStore.getLoginErrorMessage(loginResult);
    this.handleError(errorMessage);
  }

  protected handleFailedOtpLogin(loginResult: LoginResult): void {
    const errorMessage = this.signinStore.getLoginErrorMessage(loginResult, true);

    this.form.patchValue({ otp: '' });
    this.form.controls.otp.updateValueAndValidity();
    this.isLastOtpAttemptFailed.set(true);

    this.handleError(errorMessage);
  }

  protected clearForm(): void {
    this.form.patchValue({ password: '', otp: '' });
    this.form.controls.password.setErrors(null);
    this.form.controls.otp.setErrors(null);
  }

  protected cancelOtpLogin(): void {
    this.hasTwoFactor.set(false);
    this.clearForm();
  }

  protected loginWithOtp(event?: Event): void {
    event?.preventDefault();
    this.signinStore.setLoadingState(true);
    const formValues = this.form.getRawValue();
    this.authService.login(formValues.username, formValues.password, formValues.otp).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ loginResult }) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.handleFailedOtpLogin(loginResult);
          this.signinStore.setLoadingState(false);
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  protected handleError(errorMessage: TranslatedString): void {
    this.signinStore.setLoadingState(false);
    this.lastLoginError.set(errorMessage);
    this.isLastLoginAttemptFailed.set(true);
    this.snackbar.error(errorMessage);
  }
}
