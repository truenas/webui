import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, Inject, input, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import * as _ from 'lodash-es';
import {
  distinctUntilChanged, EMPTY, firstValueFrom, switchMap,
} from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { InsecureConnectionComponent } from 'app/pages/signin/insecure-connection/insecure-connection.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

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
    CommonDirectivesModule,
    InsecureConnectionComponent,
    MatButton,
    TestIdModule,
    AsyncPipe,
    TranslateModule,
    IxInputComponent,
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
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private signinStore: SigninStore,
    private translate: TranslateService,
    private authService: AuthService,
    private ws: WebSocketService,
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
      distinctUntilChanged(_.isEqual),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLastLoginAttemptFailed = false;
        this.isLastOtpAttemptFailed = false;
        this.cdr.markForCheck();
      },
    });
  }

  async login(): Promise<void> {
    if (await firstValueFrom(this.signinStore.isLoading$)) {
      return;
    }
    performance.mark('Login Start');
    this.isLastLoginAttemptFailed = false;
    this.signinStore.setLoadingState(true);
    const formValues = this.form.value;
    this.cdr.markForCheck();
    this.ws.call('auth.two_factor_auth', [formValues.username, formValues.password]).pipe(
      switchMap((isTwoFactorEnabled) => {
        this.hasTwoFactor = isTwoFactorEnabled;
        if (isTwoFactorEnabled) {
          this.signinStore.setLoadingState(false);
          this.hasTwoFactor = true;

          const message = this.translate.instant('2FA has been configured for this account. Enter the OTP to continue.');
          this.signinStore.showSnackbar(message);

          this.cdr.markForCheck();
          return EMPTY;
        }
        return this.authService.login(formValues.username, formValues.password);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (loginResult) => {
        this.signinStore.setLoadingState(false);
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.handleFailedLogin(loginResult);
          this.cdr.markForCheck();
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  private handleFailedLogin(loginResult: LoginResult): void {
    this.isLastLoginAttemptFailed = true;
    this.cdr.markForCheck();
    this.lastLoginError = loginResult === LoginResult.NoAccess
      ? this.translate.instant('User is lacking permissions to access WebUI.')
      : this.translate.instant('Wrong username or password. Please try again.');
    this.signinStore.showSnackbar(this.lastLoginError);
  }

  private handleFailedOtpLogin(loginResult: LoginResult): void {
    this.lastLoginError = loginResult === LoginResult.NoAccess
      ? this.translate.instant('User is lacking permissions to access WebUI.')
      : this.translate.instant('Incorrect or expired OTP. Please try again.');
    this.signinStore.showSnackbar(this.lastLoginError);
    this.form.patchValue({ otp: '' });
    this.form.controls.otp.updateValueAndValidity();
    this.isLastOtpAttemptFailed = true;
    this.cdr.markForCheck();
  }

  private clearForm(): void {
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
    const formValues = this.form.value;
    this.authService.login(formValues.username, formValues.password, formValues.otp).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (loginResult) => {
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.handleFailedOtpLogin(loginResult);
          this.signinStore.setLoadingState(false);
          this.cdr.markForCheck();
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }
}
