import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSectionComponent implements OnInit {
  sshAccessEnabled = this.userStore.sshAccess;
  smbAccessEnabled = this.userStore.smbAccess;

  form = this.fb.group({
    password: [''],
    disable_password: [false],
    allow_ssh_login_with_password: [false],
    ssh_key: [''],
  });

  constructor(
    private fb: FormBuilder,
    private userStore: UserFormStore,
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
        this.userStore.updateUserConfig({
          ssh_password_enabled: this.form.controls.allow_ssh_login_with_password.value,
          password_disabled: this.form.value.disable_password,
          password: this.form.value.password,
          sshpubkey: this.form.value.ssh_key,
        });
      },
    });
  }

  ngOnInit(): void {
    this.form.controls.disable_password.disable();
  }
}
