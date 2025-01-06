import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import {
  FormBuilder, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { LoginResult } from 'app/enums/login-result.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SigninStore } from 'app/pages/signin/store/signin.store';

const adminUsername = 'truenas_admin';

@UntilDestroy()
@Component({
  selector: 'ix-set-admin-password-form',
  templateUrl: './set-admin-password-form.component.html',
  styleUrls: ['./set-admin-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButton,
    AsyncPipe,
    TranslateModule,
    IxInputComponent,
    TestDirective,
  ],
})
export class SetAdminPasswordFormComponent {
  isLoading$ = this.signinStore.isLoading$;

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

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private authService: AuthService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private signinStore: SigninStore,
  ) { }

  onSubmit(): void {
    const { username, password } = this.form.getRawValue();
    this.signinStore.setLoadingState(true);

    const request$ = this.api.call('user.setup_local_administrator', [username, password]);

    request$.pipe(
      switchMap(() => this.authService.login(username, password)),
      untilDestroyed(this),
    ).subscribe({
      next: (loginResult) => {
        this.signinStore.setLoadingState(false);

        if (loginResult === LoginResult.Success) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.signinStore.showSnackbar(this.translate.instant('Login error. Please try again.'));
        }
      },
      error: (error: unknown) => {
        this.errorHandler.handleValidationErrors(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }
}
