import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { SystemEnvironment } from 'app/enums/system-environment.enum';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-set-root-password-form',
  templateUrl: './set-root-password-form.component.html',
  styleUrls: ['./set-root-password-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetRootPasswordFormComponent implements OnInit {
  form = this.formBuilder.group({
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
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.checkForEc2Environment();
  }

  onSubmit(): void {
    const formValues = this.form.value;
    this.isLoading = true;

    const request$ = this.hasInstanceId
      ? this.ws.call('user.set_root_password', [formValues.password, { instance_id: formValues.instanceId }])
      : this.ws.call('user.set_root_password', [formValues.password]);

    request$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isLoading = true;
        this.cdr.markForCheck();
        // TODO: Login success
        // this.ws.login('root', this.password.value)
        //   .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
      },
      (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    );
  }

  private checkForEc2Environment(): void {
    this.ws.call('system.environment').pipe(untilDestroyed(this)).subscribe((env) => {
      this.hasInstanceId = env === SystemEnvironment.Ec2;
      if (this.hasInstanceId) {
        this.form.controls['instanceId'].enable();
      } else {
        this.form.controls['instanceId'].disable();
      }

      this.cdr.markForCheck();
    });
  }
}
