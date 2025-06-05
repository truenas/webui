import {
  ChangeDetectionStrategy, Component, computed, effect, input, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  from, of, Subscription, switchMap,
} from 'rxjs';
import { helptextUsers } from 'app/helptext/account/user-form';
import { User } from 'app/interfaces/user.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-auth-section',
  templateUrl: './auth-section.component.html',
  styleUrl: './auth-section.component.scss',
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxFieldsetComponent,
    TranslateModule,
    IxRadioGroupComponent,
    IxSlideToggleComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
    IxFileInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSectionComponent implements OnInit {
  protected editingUser = input<User>();
  protected isNewUser = computed(() => !this.editingUser());
  protected sshAccessEnabled = this.userFormStore.sshAccess;
  protected smbAccessEnabled = this.userFormStore.smbAccess;
  protected isStigMode = this.userFormStore.isStigMode;
  protected subscriptions: Subscription[] = [];

  form = this.fb.group({
    password: ['', this.validatorsService.validateOnCondition(
      () => this.isNewUser(),
      Validators.required,
    )],
    password_conf: ['', this.validatorsService.validateOnCondition(
      () => this.isNewUser(),
      Validators.required,
    )],
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
    password_conf_edit: helptextUsers.passwordTooltip,
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
    private fb: FormBuilder,
    private userFormStore: UserFormStore,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {
    effect(() => {
      const smbAccess = this.smbAccessEnabled();
      if (smbAccess) {
        this.form.controls.password_disabled.disable();
      } else {
        this.form.controls.password_disabled.enable();
      }

      if (this.isNewUser()) {
        this.form.patchValue({ show_password: true });
      }
    });

    if (this.editingUser()) {
      this.form.patchValue({
        sshpubkey: this.editingUser().sshpubkey || '',
        ssh_password_enabled: this.editingUser().ssh_password_enabled || false,
      });
    }

    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (values) => {
        this.userFormStore.updateUserConfig({
          ssh_password_enabled: values.ssh_password_enabled,
          sshpubkey: values.sshpubkey,
          password_disabled: values.password_disabled,
          password: values.password,
        });
      },
    });

    this.form.controls.sshpubkey_file.valueChanges.pipe(
      switchMap((files: File[]) => {
        return !files?.length ? of('') : from(files[0].text());
      }),
      untilDestroyed(this),
    ).subscribe((key) => {
      this.form.controls.sshpubkey.setValue(key);
    });
  }

  ngOnInit(): void {
    this.form.controls.password_disabled.disable();
    this.setControlHandlers();
  }

  private setControlHandlers(): void {
    this.form.addValidators(
      matchOthersFgValidator(
        'password_conf',
        ['password'],
        this.translate.instant(this.isNewUser()
          ? 'Password and confirmation should match.'
          : 'New password and confirmation should match.'),
      ),
    );

    this.subscriptions.push(
      this.form.controls.password.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.password_conf.disabledWhile(this.form.controls.password_disabled.value$),
    );
  }
}
