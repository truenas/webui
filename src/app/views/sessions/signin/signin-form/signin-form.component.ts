import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
  filter, of, switchMap, tap,
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
export class SigninFormComponent implements OnInit {
  @ViewChild('usernameField', { static: true, read: ElementRef }) usernameField: ElementRef<HTMLElement>;

  hasTwoFactor = false;

  private enableLoginBtn$ = new BehaviorSubject<boolean>(false);
  private enableOtpLoginBtn$ = new BehaviorSubject<boolean>(false);
  protected isLoading = false;

  get shouldEnableLoginBtn$(): Observable<boolean> {
    return this.enableLoginBtn$.asObservable();
  }

  get shouldEnableLoginWithOtpBtn$(): Observable<boolean> {
    return this.enableOtpLoginBtn$.asObservable();
  }

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

  ngOnInit(): void {
    this.signinStore.isLoading$.pipe(untilDestroyed(this)).subscribe({
      next: (isLoading) => {
        this.isLoading = isLoading;
        this.enableLoginBtn$.next(
          !this.isLoading && !!this.form.controls.username.valid && !!this.form.controls.password.valid,
        );
        this.enableOtpLoginBtn$.next(
          !this.isLoading && !!this.form.controls.otp.valid,
        );
      },
    });
    this.form.controls.username.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.enableLoginBtn$.next(
          !this.isLoading && !!this.form.controls.username.valid && !!this.form.controls.password.valid,
        );
      },
    });
    this.form.controls.password.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.enableLoginBtn$.next(
          !this.isLoading && !!this.form.controls.username.valid && !!this.form.controls.password.valid,
        );
      },
    });
    this.form.controls.otp.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.enableOtpLoginBtn$.next(
          !this.isLoading && !!this.form.controls.otp.valid,
        );
      },
    });
  }

  onSubmit(): void {
    this.signinStore.setLoadingState(true);
    const formValues = this.form.value;
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
    const message: string = this.translate.instant('Wrong username or password. Please try again.');
    this.signinStore.showSnackbar(message);
  }

  private handleFailedOtpLogin(): void {
    const message: string = this.translate.instant('Incorrect or expired OTP. Please try again.');
    this.signinStore.showSnackbar(message);
    this.form.patchValue({ otp: '' });
    this.form.controls.otp.updateValueAndValidity();
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
