import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  distinctUntilChanged,
  filter, of, switchMap, tap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

@UntilDestroy()
@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninFormComponent implements OnInit {
  hasTwoFactor = false;
  showSecurityWarning = false;

  protected isLastLoginAttemptFailed = false;
  protected isLastOtpAttemptFailed = false;

  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    otp: ['', Validators.required],
  });

  protected isLoading$ = this.signinStore.isLoading$;

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
    if (this.window.location.protocol !== 'https:') {
      this.showSecurityWarning = true;
    }
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

  login(): void {
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

          const message: string = this.translate.instant('2FA has been configured for this account. Enter the OTP to continue.');
          this.signinStore.showSnackbar(message);

          this.cdr.markForCheck();
          return of(false);
        }
        return this.authService.login(formValues.username, formValues.password).pipe(
          tap((wasLoggedIn) => {
            if (!wasLoggedIn) {
              this.handleFailedLogin();
              this.signinStore.setLoadingState(false);
              this.cdr.markForCheck();
            }
          }),
        );
      }),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.signinStore.handleSuccessfulLogin();
      },
      error: (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  private handleFailedLogin(): void {
    this.isLastLoginAttemptFailed = true;
    this.cdr.markForCheck();
    const message: string = this.translate.instant('Wrong username or password. Please try again.');
    this.signinStore.showSnackbar(message);
  }

  private handleFailedOtpLogin(): void {
    const message: string = this.translate.instant('Incorrect or expired OTP. Please try again.');
    this.signinStore.showSnackbar(message);
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
      tap((wasLoggedIn) => {
        if (!wasLoggedIn) {
          this.handleFailedOtpLogin();
          this.signinStore.setLoadingState(false);
          this.cdr.markForCheck();
        }
      }),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.signinStore.handleSuccessfulLogin();
      },
      error: (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }
}
