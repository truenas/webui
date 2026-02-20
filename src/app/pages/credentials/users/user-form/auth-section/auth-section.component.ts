import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { isEmptyHomeDirectory } from 'app/helpers/user.helper';
import { helptextUsers } from 'app/helptext/account/user-form';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { UserFormStore, UserStigPasswordOption, defaultHomePath } from 'app/pages/credentials/users/user-form/user.store';

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
  private destroyRef = inject(DestroyRef);

  editingUser = input<User>();
  homeDirectory = input<string>();
  shell = input<string | null>();

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
      this.sshPasswordEnabledValidator.bind(this),
      matchOthersFgValidator(
        'password_confirm',
        ['password'],
        this.translate.instant('Passwords do not match'),
      ),
    ],
  });

  protected readonly tooltips = {
    one_time_password: helptextUsers.oneTimePasswordTooltip,
    password: helptextUsers.passwordTooltip,
    password_edit: helptextUsers.passwordTooltip,
    password_confirm: helptextUsers.passwordConfirmTooltip,
    sshpubkey: helptextUsers.publicKeyTooltip,
  };

  protected passwordDisabledTooltip = computed(() => {
    if (this.smbAccess()) {
      return this.translate.instant('Password cannot be disabled when SMB access is enabled. SMB authentication requires a password.');
    }
    return helptextUsers.disablePasswordTooltip;
  });

  protected stigPasswordOptions$ = of([
    {
      label: this.translate.instant('Disable Password'),
      value: UserStigPasswordOption.DisablePassword,
      tooltip: this.translate.instant(helptextUsers.disablePasswordTooltip),
    },
    {
      label: this.translate.instant('Generate Temporary One-Time Password'),
      value: UserStigPasswordOption.OneTimePassword,
      tooltip: this.translate.instant(this.tooltips.one_time_password),
    },
  ]);

  constructor() {
    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        const rawValue = this.form.getRawValue();
        this.userStore.updateUserConfig({
          ssh_password_enabled: rawValue.ssh_password_enabled,
          password_disabled: rawValue.password_disabled,
          password: rawValue.password,
          sshpubkey: rawValue.sshpubkey,
        });
      },
    });


    effect(() => {
      if (this.editingUser()) {
        // Use emitEvent: false to prevent cross-field value change handlers
        // from interfering (e.g., ssh_password_enabled handler resetting password_disabled).
        // This is safe because the store is already hydrated directly via
        // setupEditUserForm() in user-form.component.ts before this runs.
        this.form.patchValue({
          password_disabled: this.editingUser().password_disabled,
          ssh_password_enabled: this.editingUser().ssh_password_enabled,
          sshpubkey: this.editingUser().sshpubkey,
        }, { emitEvent: false });
      }
    });

    effect(() => {
      if (!this.sshAccess()) {
        this.form.patchValue({
          ssh_password_enabled: false,
          sshpubkey: '',
        });
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
        this.form.controls.password_disabled.disable({ emitEvent: false });
        this.form.patchValue({ password_disabled: false });
      } else {
        this.form.controls.password_disabled.enable({ emitEvent: false });
        // Ensure password field state is consistent when SMB is disabled
        if (!this.form.value.password_disabled) {
          this.form.controls.password.enable({ emitEvent: false });
        }
      }
    });

    effect(() => {
      this.setupPasswordValidation();
    });

    // Revalidate when home directory or shell changes
    effect(() => {
      this.homeDirectory();
      this.shell();
      this.form.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.setPasswordFieldRelations();
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

  private sshPasswordEnabledValidator(formGroup: AbstractControl): ValidationErrors | null {
    // Skip validation if SSH access is not enabled
    if (!this.sshAccess()) {
      return null; // SSH access is not enabled, no validation needed
    }

    const sshPasswordEnabled = formGroup.get('ssh_password_enabled')?.value;

    if (!sshPasswordEnabled) {
      return null; // Checkbox is not checked, no validation needed
    }

    const homeDir = this.homeDirectory();
    const userShell = this.shell();

    // Check if home directory is valid (not empty and not default empty path)
    const hasValidHome = homeDir && !isEmptyHomeDirectory(homeDir) && homeDir !== defaultHomePath;

    // Check if shell is valid (not null/empty and not nologin)
    const hasValidShell = userShell && userShell !== '/usr/sbin/nologin';

    if (!hasValidHome || !hasValidShell) {
      return {
        ssh_password_enabled: {
          message: this.translate.instant('Cannot be enabled without a valid home path and login shell.'),
        },
      };
    }

    return null;
  }

  private setPasswordFieldRelations(): void {
    this.form.controls.password_disabled.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isDisabled) => {
      if (isDisabled) {
        this.form.controls.password.disable();
        this.form.controls.password_confirm.disable();
        this.form.controls.ssh_password_enabled.setValue(false, { emitEvent: false });
        this.form.controls.ssh_password_enabled.disable({ emitEvent: false });
      } else {
        this.form.controls.password.enable();
        this.form.controls.password_confirm.enable();
        this.form.controls.ssh_password_enabled.enable({ emitEvent: false });
      }
    });

    this.form.controls.ssh_password_enabled.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
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
