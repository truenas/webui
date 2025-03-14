import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AllowAccessConfig } from 'app/pages/credentials/users/new-user-form/interfaces/allow-access-config.interface';

@UntilDestroy()
@Component({
  selector: 'ix-allowed-access-section',
  templateUrl: './allowed-access-section.component.html',
  styleUrl: './allowed-access-section.component.scss',
  standalone: true,
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
  allowAccessConfigUpdate = output<AllowAccessConfig>();
  protected readonly fakeTooltip = '';

  protected readonly roles$ = of([
    { label: 'Select Role', value: 'prompt' },
    { label: 'Full Admin', value: Role.FullAdmin },
    { label: 'Sharing Admin', value: Role.SharingAdmin },
    { label: 'Readonly Admin', value: Role.ReadonlyAdmin },
  ]);

  form = this.fb.group({
    smb_access: [true],
    truenas_access: [false],
    ssh_access: [false],
    shell_access: [false],
    role: ['prompt'],
  });

  constructor(
    private fb: FormBuilder,
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
        this.allowAccessConfigUpdate.emit({
          smbAccess: this.form.controls.smb_access.value,
          truenasAccess: {
            enabled: this.form.controls.truenas_access.value,
            role: 'prompt',
          },
          sshAccess: this.form.controls.ssh_access.value,
          shellAccess: this.form.controls.shell_access.value,
        });
      },
    });
  }
}
