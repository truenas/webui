import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, Inject, input, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Validators, FormsModule, ReactiveFormsModule, NonNullableFormBuilder,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
import { IxFieldInputComponent } from 'app/modules/forms/ix-forms/components/ix-field-input/ix-field-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InsecureConnectionComponent } from 'app/pages/signin/insecure-connection/insecure-connection.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

@UntilDestroy()
@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InsecureConnectionComponent,
    MatButton,
    TranslateModule,
    IxFieldInputComponent,
    TestDirective,
  ],
})
export class SigninFormComponent implements OnInit {
  disabled = input.required<boolean>();

  hasTwoFactor = false;
  showSecurityWarning = false;

  protected isLastLoginAttemptFailed = false;
  protected isLastOtpAttemptFailed = false;
  protected lastLoginError: string;

  form = this.formBuilder.group({
    username: [''],
    password: [''],
    otp: ['', Validators.required],
  });

  protected isLoading = toSignal(this.signinStore.isLoading$);
  readonly isFormDisabled = computed(() => this.disabled() || this.isLoading());

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private errorHandler: FormErrorHandlerService,
    private signinStore: SigninStore,
    private translate: TranslateService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    effect(() => {
      if (this.isFormDisabled()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    if (this.window.location.protocol !== 'https:') {
      this.showSecurityWarning = true;
    }

    this.signinStore.isLoading$.pipe(
      filter((isLoading) => !isLoading),
      take(1),
      untilDestroyed(this),
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
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLastLoginAttemptFailed = false;
        this.isLastOtpAttemptFailed = false;
        this.cdr.markForCheck();
      },
    });
  }

  protected async login(): Promise<void> {
    if (await firstValueFrom(this.signinStore.isLoading$)) {
      return;
    }
    performance.mark('Login Start');
    this.isLastLoginAttemptFailed = false;
    this.signinStore.setLoadingState(true);
    const formValues = this.form.getRawValue();
    this.cdr.markForCheck();
    this.authService.login(formValues.username, formValues.password).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ({ loginResult, loginResponse }) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.signinStore.setLoadingState(false);
          this.handleFailedLogin(loginResult, loginResponse);
          this.cdr.markForCheck();
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  protected handleFailedLogin(loginResult: LoginResult, loginResponse: LoginExResponse): void {
    this.isLastLoginAttemptFailed = true;

    if (loginResult === LoginResult.NoOtp) {
      this.hasTwoFactor = true;
      this.form.controls.password.setValue('');
      return;
    }

    if (loginResult === LoginResult.Redirect) {
      const links = (loginResponse as LoginRedirectResponse).urls.map((url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }).join(', ');

      this.lastLoginError = this.translate.instant(
        'Logging in at the current URL is not possible.<br>To login, please navigate to: {links}',
        { links },
      );
      this.cdr.markForCheck();
      this.signinStore.showSnackbar(this.translate.instant('Logging in at the current URL is not possible.'));

      return;
    }

    const errorMessage = this.signinStore.getLoginErrorMessage(loginResult);
    this.handleError(errorMessage);
  }

  protected handleFailedOtpLogin(loginResult: LoginResult): void {
    const errorMessage = this.signinStore.getLoginErrorMessage(loginResult, true);

    this.form.patchValue({ otp: '' });
    this.form.controls.otp.updateValueAndValidity();
    this.isLastOtpAttemptFailed = true;

    this.handleError(errorMessage);
  }

  protected clearForm(): void {
    this.form.patchValue({ password: '', otp: '' });
    this.form.controls.password.setErrors(null);
    this.form.controls.otp.setErrors(null);
  }

  protected cancelOtpLogin(): void {
    this.hasTwoFactor = false;
    this.clearForm();
  }

  protected loginWithOtp(): void {
    this.signinStore.setLoadingState(true);
    const formValues = this.form.getRawValue();
    this.authService.login(formValues.username, formValues.password, formValues.otp).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ({ loginResult }) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.handleFailedOtpLogin(loginResult);
          this.signinStore.setLoadingState(false);
          this.cdr.markForCheck();
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  protected readonly iconMarker = iconMarker;

  protected handleError(errorMessage: string): void {
    this.signinStore.setLoadingState(false);
    this.lastLoginError = errorMessage;
    this.isLastLoginAttemptFailed = true;
    this.cdr.markForCheck();
    this.signinStore.showSnackbar(errorMessage);
  }
}
