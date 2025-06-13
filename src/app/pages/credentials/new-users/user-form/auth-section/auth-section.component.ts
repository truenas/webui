import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  from, of, Subscription, switchMap,
} from 'rxjs';
import { helptextUsers } from 'app/helptext/account/user-form';
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
  protected isNewUser = this.userStore.isNewUser;
  protected sshAccess = this.userStore.sshAccess;
  protected smbAccess = this.userStore.smbAccess;
  protected isStigMode = this.userStore.isStigMode;
  protected subscriptions: Subscription[] = [];

  form = this.formBuilder.group({
    password: [''],
    password_disabled: [false],
    stig_password: ['' as UserStigPasswordOption],
    show_password: [false],
    ssh_password_enabled: [false],
    sshpubkey: [''],
    sshpubkey_file: [null as File[]],
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
    private formBuilder: FormBuilder,
    private userStore: UserFormStore,
    private translate: TranslateService,
  ) {
    effect(() => {
      const smbAccess = this.smbAccess();
      if (smbAccess) {
        this.form.controls.password_disabled.disable();
      } else {
        this.form.controls.password_disabled.enable();
      }

      if (this.isNewUser()) {
        this.form.patchValue({ show_password: true });
      }
    });
    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.userStore.updateUserConfig({
          ssh_password_enabled: this.form.controls.ssh_password_enabled.value,
          password_disabled: this.form.value.password_disabled,
          password: this.form.value.password,
          sshpubkey: this.form.value.sshpubkey,
        });
      },
    });
  }

  ngOnInit(): void {
    this.form.controls.password_disabled.disable();
    this.setControlHandlers();
  }

  private setControlHandlers(): void {
    this.form.controls.sshpubkey_file.valueChanges.pipe(
      switchMap((files: File[]) => {
        return !files?.length ? of('') : from(files[0].text());
      }),
      untilDestroyed(this),
    ).subscribe((key) => {
      this.form.controls.sshpubkey.setValue(key);
    });
  }
}
