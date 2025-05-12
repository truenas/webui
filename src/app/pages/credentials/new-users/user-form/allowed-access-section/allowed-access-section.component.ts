import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
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
          this.form.controls.shell_access.disable();
          this.form.controls.shell_access.setValue(true);
        } else {
          this.form.controls.shell_access.enable();
        }
      },
    });

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.userFormStore.setAllowedAccessConfig({
          smbAccess: this.form.controls.smb_access.value,
          truenasAccess: this.form.controls.truenas_access.value,
          sshAccess: this.form.controls.ssh_access.value,
          shellAccess: this.form.controls.shell_access.value,
        });

        if (this.form.controls.truenas_access.value) {
          this.userFormStore.updateSetupDetails({
            role: defaultRole,
          });
        }
      },
    });
  }
}
