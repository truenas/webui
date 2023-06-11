import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, switchMap,
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
      request$ = this.authService.login(formValues.username, formValues.password, formValues.otp);
    } else {
      request$ = this.ws.call('auth.two_factor_auth', [formValues.username, formValues.password]).pipe(
        switchMap((isTwoFactorEnabled) => {
          this.hasTwoFactor = isTwoFactorEnabled;
          if (isTwoFactorEnabled) {
            this.hasTwoFactor = true;
            this.cdr.markForCheck();
            return of(false);
          }
          return this.authService.login(formValues.username, formValues.password);
        }),
      );
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (wasLoggedIn) => {
        this.signinStore.setLoadingState(false);

        if (!wasLoggedIn) {
          this.handleFailedLogin();
          return;
        }

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
