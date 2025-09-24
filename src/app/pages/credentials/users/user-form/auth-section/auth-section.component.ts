import { ChangeDetectionStrategy, Component, effect, input, OnInit, inject } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { UserFormStore, UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user.store';

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
  private formBuilder = inject(NonNullableFormBuilder);
  private userStore = inject(UserFormStore);
  private translate = inject(TranslateService);

  editingUser = input<User>();
  protected sshAccess = this.userStore.sshAccess;
  protected smbAccess = this.userStore.smbAccess;
  protected isStigMode = this.userStore.isStigMode;

  form = this.formBuilder.group({
    password: ['', [Validators.required]],
    password_confirm: [''],
    password_disabled: [false],
    ssh_password_enabled: [false],
    sshpubkey: [''],
    stig_password: [UserStigPasswordOption.DisablePassword],
  }, {
    validators: [
      this.sshAccessValidator.bind(this),
      matchOthersFgValidator(
        'password_confirm',
        ['password'],
        this.translate.instant('Passwords do not match'),
      ),
    ],
  });

  protected readonly tooltips = {
    password_disabled: helptextUsers.disablePasswordTooltip,
    one_time_password: helptextUsers.oneTimePasswordTooltip,
    password: helptextUsers.passwordTooltip,
    password_edit: helptextUsers.passwordTooltip,
    password_confirm: helptextUsers.passwordConfirmTooltip,
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

  constructor() {
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
      } else if (this.form.value.password_disabled) {
        // If SSH access is enabled but password is disabled, SSH password authentication should be false
        this.form.patchValue({ ssh_password_enabled: false });
      }
      // Trigger validation update when SSH access changes
      this.form.updateValueAndValidity();
    });

    effect(() => {
      if (this.smbAccess()) {
        this.form.controls.password.enable({ emitEvent: false });
        this.form.patchValue({ password_disabled: false });
      }
    });

    effect(() => {
      this.setupPasswordValidation();
    });
  }

  ngOnInit(): void {
    this.setPasswordFieldRelations();
    this.setupPasswordValidation();
  }

  private setupPasswordValidation(): void {
    if (this.editingUser()) {
      this.form.controls.password.removeValidators([Validators.required]);
      this.form.controls.password.reset();
      this.form.controls.password_confirm.clearValidators();
      this.form.controls.password_confirm.reset();
    } else {
      this.form.controls.password_confirm.setValidators([Validators.required]);
    }
    this.form.controls.password_confirm.updateValueAndValidity();
  }

  private sshAccessValidator(formGroup: AbstractControl): ValidationErrors | null {
    if (!this.sshAccess()) {
      return null; // SSH access is not enabled, no validation needed
    }

    const sshPasswordEnabled = formGroup.get('ssh_password_enabled')?.value;
    const sshPublicKey = formGroup.get('sshpubkey')?.value;
    const hasSshKey = sshPublicKey && sshPublicKey.trim().length > 0;

    if (!sshPasswordEnabled && !hasSshKey) {
      return {
        sshAccessRequired: {
          message: this.translate.instant('SSH access requires either password authentication or an SSH public key'),
        },
      };
    }

    return null;
  }

  private setPasswordFieldRelations(): void {
    this.form.controls.password_disabled.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe((isDisabled) => {
      if (isDisabled) {
        this.form.controls.password.disable();
        this.form.controls.password_confirm.disable();
        this.form.controls.ssh_password_enabled.disable({ emitEvent: false });
      } else {
        this.form.controls.password.enable();
        this.form.controls.password_confirm.enable();
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
