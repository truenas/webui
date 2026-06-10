import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnBannerComponent, TnButtonComponent, TnFormFieldComponent, TnInputComponent, tnIconMarker,
} from '@truenas/ui-components';
import { switchMap } from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { TnInputNativeAttrsDirective } from 'app/pages/signin/tn-input-native-attrs.directive';

const adminUsername = 'truenas_admin';

@Component({
  selector: 'ix-set-admin-password-form',
  templateUrl: './set-admin-password-form.component.html',
  styleUrls: ['./set-admin-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TnBannerComponent,
    TnButtonComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnInputNativeAttrsDirective,
    AsyncPipe,
    TranslateModule,
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

  isLoading$ = this.signinStore.isLoading$;

  protected isPasswordVisible = signal(false);
  protected isPassword2Visible = signal(false);

  protected readonly tnIconMarker = tnIconMarker;
  protected readonly InputType = InputType;

  protected readonly passwordErrorMessages = {
    required: this.translate.instant('{field} is required', {
      field: this.translate.instant('Password'),
    }),
  };

  protected readonly password2ErrorMessages = {
    required: this.translate.instant('{field} is required', {
      field: this.translate.instant('Confirm Password'),
    }),
    matchOther: this.translate.instant('Passwords do not match'),
  };

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

    const request$ = this.api.call('user.setup_local_administrator', [username, password]);

    request$.pipe(
      switchMap(() => this.authService.login(username, password)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ loginResult }) => {
        this.signinStore.setLoadingState(false);

        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.snackbar.error(this.translate.instant('Login error. Please try again.'));
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }
}
