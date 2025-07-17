import {
  ChangeDetectionStrategy, Component, effect, input, OnInit,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { helptextUsers } from 'app/helptext/account/user-form';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-auth-section',
  styleUrl: './auth-section.component.scss',
  templateUrl: './auth-section.component.html',
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxFieldsetComponent,
    TranslateModule,
    IxRadioGroupComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSectionComponent implements OnInit {
  editingUser = input<User>();
  protected sshAccess = this.userStore.sshAccess;
  protected smbAccess = this.userStore.smbAccess;
  protected isStigMode = this.userStore.isStigMode;

  form = this.formBuilder.group({
    password: ['', [Validators.required]],
    password_disabled: [false],
    ssh_password_enabled: [false],
    sshpubkey: [''],
    stig_password: [UserStigPasswordOption.DisablePassword],
  });

  protected readonly tooltips = {
    password_disabled: helptextUsers.disablePasswordTooltip,
    one_time_password: helptextUsers.oneTimePasswordTooltip,
    password: helptextUsers.passwordTooltip,
    password_edit: helptextUsers.passwordTooltip,
    sshpubkey: helptextUsers.publicKeyTooltip,
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
    private formBuilder: NonNullableFormBuilder,
    private userStore: UserFormStore,
    private translate: TranslateService,
  ) {
    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.userStore.updateUserConfig({
          ssh_password_enabled: this.form.value.ssh_password_enabled,
          password_disabled: this.smbAccess()
            ? false
            : this.form.value.password_disabled,
          password: this.form.value.password,
          sshpubkey: this.form.value.sshpubkey,
        });
      },
    });

    effect(() => {
      if (this.editingUser()) {
        this.form.patchValue({
          password_disabled: this.editingUser().password_disabled,
          ssh_password_enabled: this.editingUser().ssh_password_enabled,
          sshpubkey: this.editingUser().sshpubkey,
        });
      }
    });

    effect(() => {
      if (!this.sshAccess()) {
        this.form.patchValue({ ssh_password_enabled: false });
        this.form.controls.password_disabled.enable({ emitEvent: false });
      }
    });

    effect(() => {
      if (this.smbAccess()) {
        this.form.controls.password.enable({ emitEvent: false });
        this.form.patchValue({ password_disabled: false });
      }
    });
  }

  ngOnInit(): void {
    this.setPasswordFieldRelations();

    if (this.editingUser()) {
      this.form.controls.password.removeValidators([Validators.required]);
      this.form.controls.password.reset();
    }
  }

  private setPasswordFieldRelations(): void {
    this.form.controls.password_disabled.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe((isDisabled) => {
      if (isDisabled) {
        this.form.controls.password.disable();
        this.form.controls.ssh_password_enabled.disable({ emitEvent: false });
      } else {
        this.form.controls.password.enable();
        this.form.controls.ssh_password_enabled.enable({ emitEvent: false });
      }
    });

    this.form.controls.ssh_password_enabled.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe((sshPasswordEnabled) => {
      if (sshPasswordEnabled) {
        this.form.controls.password_disabled.disable({ emitEvent: false });
        this.form.controls.password_disabled.setValue(false);
      } else {
        this.form.controls.password_disabled.enable({ emitEvent: false });
      }
    });
  }
}
