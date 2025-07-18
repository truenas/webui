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
  distinctUntilChanged, firstValueFrom, forkJoin, catchError, of,
} from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExResponse, LoginRedirectResponse } from 'app/interfaces/auth.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InsecureConnectionComponent } from 'app/pages/signin/insecure-connection/insecure-connection.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';

@UntilDestroy()
@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InsecureConnectionComponent,
    MatButton,
    TranslateModule,
    IxInputComponent,
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
    private api: ApiService,
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
        this.signinStore.setLoadingState(false);
        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
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

  private handleFailedLogin(loginResult: LoginResult, loginResponse: LoginExResponse): void {
    this.isLastLoginAttemptFailed = true;

    if (loginResult === LoginResult.NoOtp) {
      this.hasTwoFactor = true;
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

    if (loginResult === LoginResult.NoAccess) {
      this.lastLoginError = this.translate.instant('User is lacking permissions to access WebUI.');
      this.cdr.markForCheck();
      this.signinStore.showSnackbar(this.lastLoginError);
    } else {
      this.checkStigModeForBetterErrorMessage();
    }
  }

  private checkStigModeForBetterErrorMessage(): void {
    const formValues = this.form.getRawValue();
    const username = formValues.username;

    if (!username) {
      this.showGenericLoginError();
      return;
    }

    forkJoin({
      systemConfig: this.api.call('system.security.config').pipe(
        catchError(() => of(null)),
      ),
      users: this.api.call('user.query', [['username', '=', username]] as unknown as QueryParams<User>).pipe(
        catchError(() => of([])),
      ),
    }).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ({ systemConfig, users }) => {
        if (systemConfig?.enable_gpos_stig && users.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const user = users[0];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (!user.twofactor_auth_configured && !user.locked && user.password_disabled === false
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            && (user.roles?.length > 0 || user.groups?.length > 0)) {
            this.lastLoginError = this.translate.instant(
              'Two-Factor Authentication is not configured for this user. '
              + 'STIG mode is enabled and requires Two-Factor Authentication for all users.',
            );
          } else {
            this.showGenericLoginError();
          }
        } else {
          this.showGenericLoginError();
        }
        this.cdr.markForCheck();
        this.signinStore.showSnackbar(this.lastLoginError);
      },
      error: () => {
        this.showGenericLoginError();
        this.cdr.markForCheck();
        this.signinStore.showSnackbar(this.lastLoginError);
      },
    });
  }

  private showGenericLoginError(): void {
    this.lastLoginError = this.translate.instant('Wrong username or password. Please try again.');
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
}
