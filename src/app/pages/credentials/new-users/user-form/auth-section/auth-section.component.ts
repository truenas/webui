import {
  ChangeDetectionStrategy, Component, effect, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { helptextUsers } from 'app/helptext/account/user-form';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-auth-section',
  templateUrl: './auth-section.component.html',
  styleUrl: './auth-section.component.scss',
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxCheckboxComponent,
    IxFieldsetComponent,
    TranslateModule,
    IxTextareaComponent,
    IxRadioGroupComponent,
    IxSlideToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSectionComponent implements OnInit {
  isNewUser = input<boolean>(false);
  sshAccessEnabled = this.userStore.sshAccess;
  smbAccessEnabled = this.userStore.smbAccess;
  isStigMode = this.userStore.isStigMode;

  form = this.fb.group({
    password: ['', this.validatorsService.validateOnCondition(
      () => this.isNewUser(),
      Validators.required,
    )],
    password_conf: ['', this.validatorsService.validateOnCondition(
      () => this.isNewUser(),
      Validators.required,
    )],
    password_disabled: [false],
    allow_ssh_login_with_password: [false],
    ssh_key: [''],
    stig_password: [''],
    show_password: [false],
  });

  protected readonly tooltips = {
    password_disabled: helptextUsers.disablePasswordTooltip,
    one_time_password: helptextUsers.oneTimePasswordTooltip,
    password: helptextUsers.passwordTooltip,
    password_edit: helptextUsers.passwordTooltip,
    password_conf_edit: helptextUsers.passwordTooltip,
  };

  protected stigPasswordOptions$ = of([
    {
      label: this.translate.instant('Disable Password'),
      value: UserStigPasswordOption.DisablePassword,
      tooltip: this.translate.instant(this.tooltips.password_disabled),
    },
    {
      label: this.translate.instant('Generate Temporary One-Time Password'),
      value: UserStigPasswordOption.OneTimePassword,
      tooltip: this.translate.instant(this.tooltips.one_time_password),
    },
  ]);

  constructor(
    private fb: FormBuilder,
    private userStore: UserFormStore,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {
    effect(() => {
      const smbAccess = this.smbAccessEnabled();
      if (smbAccess) {
        this.form.controls.password_disabled.disable();
      } else {
        this.form.controls.password_disabled.enable();
      }

      if (this.isNewUser()) {
        this.form.patchValue({ show_password: true });
      }
    });
    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.userStore.updateUserConfig({
          ssh_password_enabled: this.form.controls.allow_ssh_login_with_password.value,
          password_disabled: this.form.value.password_disabled,
          password: this.form.value.password,
          sshpubkey: this.form.value.ssh_key,
        });
      },
    });
  }

  ngOnInit(): void {
    this.form.controls.password_disabled.disable();
  }
}
