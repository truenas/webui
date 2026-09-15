import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { hasShellAccess, hasSshAccess } from 'app/helpers/user.helper';
import { User, UserFormPreset } from 'app/interfaces/user.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { defaultRole, UserFormStore } from 'app/pages/credentials/users/user-form/user.store';

@Component({
  selector: 'ix-allowed-access-section',
  templateUrl: './allowed-access-section.component.html',
  styleUrl: './allowed-access-section.component.scss',
  imports: [
    TnIconComponent,
    IxSelectComponent,
    IxErrorsComponent,
    TestDirective,
    MatCheckbox,
    IxFieldsetComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedAccessSectionComponent {
  private formBuilder = inject(NonNullableFormBuilder);
  private userFormStore = inject(UserFormStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  editingUser = input<User>();
  password = input<string>();
  passwordDisabled = input<boolean>();
  /** What a create flow wants this section to start as. Ignored while editing. */
  preset = input<UserFormPreset | undefined>(undefined);

  protected sshAccess = this.userFormStore.sshAccess;

  protected readonly roles$ = of([
    { label: roleNames.get(Role.FullAdmin), value: Role.FullAdmin },
    { label: roleNames.get(Role.SharingAdmin), value: Role.SharingAdmin },
    { label: roleNames.get(Role.ReadonlyAdmin), value: Role.ReadonlyAdmin },
  ]);

  form = this.formBuilder.group({
    smb: [true],
    webshare: [false],
    truenas_access: [false],
    ssh_access: [false],
    shell_access: [false],
    role: [null as Role | null],
  }, {
    validators: [this.smbAccessValidator.bind(this)],
  });

  constructor() {
    this.setFieldRelations();
    this.updateStoreOnChanges();
    this.applyPreset();

    // Revalidate when password changes
    effect(() => {
      this.password();
      this.form.updateValueAndValidity();
    });

    // Revalidate when SMB checkbox changes
    this.form.controls.smb.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.form.updateValueAndValidity();
    });
  }

  /**
   * Applies the create flow's preset to the one control here it can name.
   *
   * Once: a host binding an object literal hands this a new reference every
   * change-detection pass, and re-applying would undo the user's own tick each
   * time. An unlocked preset is a starting point, so it has to stop being
   * applied the moment the form is on screen.
   *
   * `setValue` before `disable`, and the disable silenced: the store learns
   * the value from the first call, and the second has nothing new to say.
   * What keeps it said is {@link updateStoreOnChanges} reporting the raw
   * value — `smb` reaches `user.create` through the store, not through the
   * form, so a disabled control that stopped reporting would quietly drop out
   * of the request.
   */
  private applyPreset(): void {
    let applied = false;

    effect(() => {
      const preset = this.preset();
      const smb = preset?.values?.smb;
      if (applied || smb === undefined || this.editingUser()) {
        return;
      }
      applied = true;
      untracked(() => {
        this.form.controls.smb.setValue(smb);
        if (preset.locked?.includes('smb')) {
          this.form.controls.smb.disable({ emitEvent: false });
        }
      });
    });
  }

  /**
   * the access role dropdown should be shown if the truenas access checkbox
   * is checked OR the user we're editing is the root user - just to show that the
   * root user does have a role.
   */
  protected showAccessRoleControl(): boolean {
    return !!this.form.value.truenas_access || this.editingUser()?.uid === 0;
  }

  private smbAccessValidator(formGroup: AbstractControl): ValidationErrors | null {
    const smbEnabled = formGroup.get('smb')?.value;

    if (!smbEnabled) {
      return null; // SMB is not enabled, no validation needed
    }

    // Skip validation for new users - password field is already required
    if (!this.editingUser()) {
      return null;
    }

    const password = this.password();
    const hasPassword = password && password.trim().length > 0;

    // Get original user state
    const user = this.editingUser();
    const originalSmbEnabled = user?.smb ?? false;

    // Show error if enabling SMB and no password entered
    // API requires password reset when enabling SMB access
    if (originalSmbEnabled === false && !hasPassword) {
      return {
        smb: {
          message: this.translate.instant('Password must be reset in order to enable SMB authentication'),
        },
      };
    }

    return null;
  }

  private setFieldDisablements(): void {
    // the root user is not permitted to:
    //   * be a member of the webshare group.
    //   * have any other access role besides Full Admin.
    const nonRootExclusiveControls = [
      this.form.controls.webshare,
      this.form.controls.truenas_access,
      this.form.controls.role,
    ];

    const doDisable = this.editingUser()?.uid === 0;

    // for each exclusive control, disable or enable it based on whether
    // we're editing the root user or any other non-root user.
    nonRootExclusiveControls.forEach((control) => {
      if (doDisable) {
        control.disable();
      } else {
        control.enable();
      }
    });
  }

  private setFieldRelations(): void {
    this.form.controls.ssh_access.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (sshAccess) => {
        if (sshAccess) {
          this.form.controls.shell_access.setValue(true);
          this.form.controls.shell_access.disable();
        } else {
          this.form.controls.shell_access.enable();
        }
      },
    });

    this.form.controls.truenas_access.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((hasAccess) => {
      if (hasAccess) {
        this.form.controls.role.setValidators([Validators.required]);
      } else {
        this.form.controls.role.clearValidators();
      }

      this.form.controls.role.updateValueAndValidity();
    });
  }

  private updateStoreOnChanges(): void {
    // `getRawValue`, not the emitted value: a disabled control is dropped from
    // the payload `valueChanges` carries, and `updateUserConfig` spreads what
    // it is given — so reporting the emission would overwrite a disabled
    // control's setting with `undefined` on the next change to any sibling,
    // and `user.create` would go out with nothing to say about it. Root's
    // edit form hits this too: its locked TrueNAS Access read `undefined`,
    // which sent `role: null` and stripped the role's group from the account.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const values = this.form.getRawValue();
        this.userFormStore.setAllowedAccessConfig({
          smbAccess: values.smb,
          webshareAccess: values.webshare,
          truenasAccess: values.truenas_access,
          sshAccess: values.ssh_access,
          shellAccess: values.shell_access,
        });

        this.userFormStore.updateUserConfig({
          smb: values.smb,
          webshare: values.webshare,
        });

        this.userFormStore.updateSetupDetails({
          role: values.truenas_access ? values.role : null,
        });
      },
    });

    effect(() => {
      if (this.editingUser()) {
        const roleValue = this.editingUser().roles.length > 0 ? this.editingUser().roles[0] : defaultRole;
        this.form.patchValue({
          smb: this.editingUser().smb,
          webshare: this.editingUser().webshare,
          truenas_access: !!this.editingUser().roles.length,
          shell_access: hasShellAccess(this.editingUser()),
          ssh_access: hasSshAccess(this.editingUser()),
          role: roleValue,
        });

        // after patching the form values, disable any controls that need disabling
        this.setFieldDisablements();

        this.userFormStore.updateSetupDetails({ role: roleValue });
      }
    });

    effect(() => {
      const role = this.userFormStore.role();
      if (!role && !this.editingUser()) {
        this.form.controls.role.patchValue(null);
      }
    });
  }
}
