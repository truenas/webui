import {
  ChangeDetectionStrategy, Component, effect, input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

const defaultRole = 'prompt';

@UntilDestroy()
@Component({
  selector: 'ix-allowed-access-section',
  templateUrl: './allowed-access-section.component.html',
  styleUrl: './allowed-access-section.component.scss',
  imports: [
    IxIconComponent,
    IxSelectComponent,
    TestDirective,
    MatCheckbox,
    IxFieldsetComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllowedAccessSectionComponent {
  editingUser = input<User>();
  protected sshAccessEnabled = this.userFormStore.sshAccess;

  protected readonly roles$ = of([
    { label: this.translate.instant('Select Role'), value: defaultRole },
    { label: roleNames.get(Role.FullAdmin), value: Role.FullAdmin },
    { label: roleNames.get(Role.SharingAdmin), value: Role.SharingAdmin },
    { label: roleNames.get(Role.ReadonlyAdmin), value: Role.ReadonlyAdmin },
  ]);

  form = this.fb.group({
    smb_access: [true],
    truenas_access: [false],
    ssh_access: [false],
    shell_access: [false],
    role: [defaultRole],
  });

  constructor(
    private fb: FormBuilder,
    private userFormStore: UserFormStore,
    private translate: TranslateService,
  ) {
    this.form.controls.ssh_access.valueChanges.pipe(
      untilDestroyed(this),
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

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (values) => {
        this.userFormStore.setAllowedAccessConfig({
          smbAccess: values.smb_access,
          truenasAccess: values.truenas_access,
          sshAccess: values.ssh_access,
          shellAccess: values.shell_access,
        });
        this.userFormStore.updateSetupDetails({
          role: values.role as Role,
        });
      },
    });

    effect(() => {
      if (this.editingUser()) {
        this.form.patchValue({
          truenas_access: !!this.editingUser().roles.length,
          shell_access: this.editingUser().shell !== '/usr/sbin/nologin',
          smb_access: this.editingUser().smb,
          ssh_access: !!this.editingUser().sshpubkey || this.editingUser().ssh_password_enabled,
          role: this.editingUser().roles.length > 0 ? this.editingUser().roles[0] : defaultRole,
        });
      }
    });
  }
}
