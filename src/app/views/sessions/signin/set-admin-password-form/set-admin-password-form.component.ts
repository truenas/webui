import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SystemEnvironment } from 'app/enums/system-environment.enum';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

const adminUsername = 'admin';

@UntilDestroy()
@Component({
  selector: 'ix-set-admin-password-form',
  templateUrl: './set-admin-password-form.component.html',
  styleUrls: ['./set-admin-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetAdminPasswordFormComponent implements OnInit {
  isLoading$ = this.signinStore.isLoading$;

  form = this.formBuilder.group({
    username: [adminUsername, Validators.required],
    password: ['', Validators.required],
    password2: ['', [
      Validators.required,
      this.validators.withMessage(
        matchOtherValidator('password'),
        this.translate.instant('Passwords do not match'),
      ),
    ]],
    instanceId: ['', Validators.required],
  });

  hasInstanceId = false;

  readonly usernameOptions$ = of([
    { label: this.translate.instant('Administrative user'), value: adminUsername },
    { label: this.translate.instant('Root user (not recommended)'), value: 'root' },
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private ws2: WebSocketService2,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
    private translate: TranslateService,
    private signinStore: SigninStore,
  ) { }

  ngOnInit(): void {
    this.checkForEc2Environment();
  }

  onSubmit(): void {
    const { username, password, instanceId } = this.form.value;
    this.signinStore.setLoadingState(true);

    const request$ = this.hasInstanceId
      ? this.ws.call('user.setup_local_administrator', [username, password, { instance_id: instanceId }])
      : this.ws.call('user.setup_local_administrator', [username, password]);

    request$.pipe(
      switchMap(() => this.ws2.call('auth.login', [username, password])),
      switchMap(() => this.ws.login(username, password)),
      untilDestroyed(this),
    ).subscribe({
      next: (wasLoggedIn) => {
        this.signinStore.setLoadingState(false);

        if (wasLoggedIn) {
          this.signinStore.handleSuccessfulLogin();
        } else {
          this.signinStore.showSnackbar(this.translate.instant('Login error. Please try again.'));
        }
      },
      error: (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.signinStore.setLoadingState(false);
      },
    });
  }

  private checkForEc2Environment(): void {
    this.ws.call('system.environment').pipe(untilDestroyed(this)).subscribe((env) => {
      this.hasInstanceId = env === SystemEnvironment.Ec2;
      if (this.hasInstanceId) {
        this.form.controls.instanceId.enable();
      } else {
        this.form.controls.instanceId.disable();
      }

      this.cdr.markForCheck();
    });
  }
}
