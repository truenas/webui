import {
  ChangeDetectionStrategy, Component, effect, input, output, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { UserAuthConfig } from 'app/pages/credentials/users/new-user-form/interfaces/user-auth-config.interface';

@UntilDestroy()
@Component({
  selector: 'ix-auth-section',
  templateUrl: './auth-section.component.html',
  styleUrl: './auth-section.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxCheckboxComponent,
    IxFieldsetComponent,
    TranslateModule,
    IxTextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSectionComponent implements OnInit {
  sshAccessEnabled = input.required<boolean>();
  smbAccessEnabled = input.required<boolean>();
  authConfigUpdate = output<UserAuthConfig>();
  protected fakeTooltip = '';
  form = this.fb.group({
    password: [''],
    disable_password: [false],
    allow_ssh_login_with_password: [false],
    ssh_key: [''],
  });

  constructor(
    private fb: FormBuilder,
  ) {
    effect(() => {
      const smbAccess = this.smbAccessEnabled();
      if (smbAccess) {
        this.form.controls.disable_password.disable();
      } else {
        this.form.controls.disable_password.enable();
      }
    });
    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.authConfigUpdate.emit({
          allowSshLoginWithPassword: this.form.value.allow_ssh_login_with_password,
          disablePassword: this.form.value.disable_password,
          password: this.form.value.password,
          sshKey: this.form.value.ssh_key,
        });
      },
    });
  }

  ngOnInit(): void {
    this.form.controls.disable_password.disable();
  }
}
