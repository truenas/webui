import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, filter, of, switchMap, tap,
} from 'rxjs';
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
export class SigninFormComponent {
  @ViewChild('usernameField', { static: true, read: ElementRef }) usernameField: ElementRef<HTMLElement>;

  isLoading$ = this.signinStore.isLoading$;
  hasTwoFactor = false;

  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    otp: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private signinStore: SigninStore,
    private translate: TranslateService,
    private authService: AuthService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) { }

  onSubmit(): void {
    this.signinStore.setLoadingState(true);
    const formValues = this.form.value;
    let request$: Observable<boolean>;
    if (this.hasTwoFactor) {
      request$ = this.authService.login(formValues.username, formValues.password, formValues.otp).pipe(
        tap((wasLoggedIn) => {
          if (!wasLoggedIn) {
            this.handleFailedLogin();
            this.signinStore.setLoadingState(false);
            this.cdr.markForCheck();
          }
        }),
      );
    } else {
      request$ = this.ws.call('auth.two_factor_auth', [formValues.username, formValues.password]).pipe(
        switchMap((isTwoFactorEnabled) => {
          this.hasTwoFactor = isTwoFactorEnabled;
          if (isTwoFactorEnabled && (isTwoFactorEnabled as unknown as boolean[]).length) {
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
      );
    }

    request$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
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
    const message: string = this.translate.instant('Username or Password is incorrect.');

    this.signinStore.showSnackbar(message);
    this.form.patchValue({ password: '', otp: '' });
    this.form.controls.password.setErrors(null);
    this.form.controls.otp.setErrors(null);
  }
}
