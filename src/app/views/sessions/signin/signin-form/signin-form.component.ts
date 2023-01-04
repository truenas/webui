import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

@UntilDestroy()
@Component({
  selector: 'ix-signin-form',
  templateUrl: './signin-form.component.html',
  styleUrls: ['./signin-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninFormComponent implements OnInit {
  isLoading$ = this.signinStore.isLoading$;

  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    otp: ['', Validators.required],
  });

  hasTwoFactor = false;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private signinStore: SigninStore,
    private translate: TranslateService,
    private ws2: WebSocketService2,
  ) { }

  ngOnInit(): void {
    this.checkForTwoFactor();
  }

  onSubmit(): void {
    this.signinStore.setLoadingState(true);
    const formValues = this.form.value;

    const request$ = this.hasTwoFactor
      ? this.ws.login(formValues.username, formValues.password, formValues.otp)
      : this.ws.login(formValues.username, formValues.password);

    request$.pipe(
      tap((wasLoggedIn) => {
        if (!wasLoggedIn) {
          return;
        }
        const params: [string, string, string] | [string, string] = this.hasTwoFactor
          ? [formValues.username, formValues.password, formValues.otp]
          : [formValues.username, formValues.password];
        this.ws2.call('auth.login', params).pipe(untilDestroyed(this)).subscribe();
      }),
      untilDestroyed(this),
    ).subscribe({
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

  private checkForTwoFactor(): void {
    this.ws.call('auth.two_factor_auth').pipe(untilDestroyed(this)).subscribe((hasTwoFactor) => {
      this.hasTwoFactor = hasTwoFactor;
      if (hasTwoFactor) {
        this.form.controls.otp.enable();
      } else {
        this.form.controls.otp.disable();
      }
      this.cdr.markForCheck();
    });
  }

  private handleFailedLogin(): void {
    let message: string;
    if (this.hasTwoFactor) {
      message = this.translate.instant('Username, Password, or 2FA Code is incorrect.');
    } else {
      message = this.translate.instant('Username or Password is incorrect.');
    }

    this.signinStore.showSnackbar(message);
    this.form.patchValue({ password: '', otp: '' });
    this.form.controls.password.setErrors(null);
    this.form.controls.otp.setErrors(null);
  }
}
