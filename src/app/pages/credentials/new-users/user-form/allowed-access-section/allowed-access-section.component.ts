import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

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
    { label: roleNames.get(Role.FullAdmin), value: Role.FullAdmin },
    { label: roleNames.get(Role.SharingAdmin), value: Role.SharingAdmin },
    { label: roleNames.get(Role.ReadonlyAdmin), value: Role.ReadonlyAdmin },
  ]);

  form = this.formBuilder.group({
    smb_access: [true],
    truenas_access: [false],
    ssh_access: [false],
    shell_access: [false],
    role: [null as Role | null],
  });

  protected get hasTrueNasAccess(): boolean {
    return this.form.controls.truenas_access.value;
  }

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private userFormStore: UserFormStore,
  ) {
    this.setFieldRelations();
    this.updateStoreOnChanges();
  }

  private setFieldRelations(): void {
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

    this.form.controls.truenas_access.valueChanges.pipe(untilDestroyed(this)).subscribe((hasAccess) => {
      if (hasAccess) {
        this.form.controls.role.setValidators([Validators.required]);
      } else {
        this.form.controls.role.clearValidators();
      }

      this.form.controls.role.updateValueAndValidity();
    });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (values) => {
        this.userFormStore.setAllowedAccessConfig({
          smbAccess: values.smb_access,
          truenasAccess: values.truenas_access,
          sshAccess: values.ssh_access,
          shellAccess: values.shell_access,
        });

        this.userFormStore.updateSetupDetails({
          role: values.truenas_access ? values.role : null,
        });
      },
    });
  }
}
