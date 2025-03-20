import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { tooltips } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/new-user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/new-user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/new-user-form/auth-section/auth-section.component';
import { AdditionalDetailsConfig } from 'app/pages/credentials/users/new-user-form/interfaces/additional-details-config.interface';
import { AllowAccessConfig } from 'app/pages/credentials/users/new-user-form/interfaces/allow-access-config.interface';
import { UserAuthConfig } from 'app/pages/credentials/users/new-user-form/interfaces/user-auth-config.interface';
import { UserFormStore } from 'app/pages/credentials/users/new-user-form/new-user.store';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-new-user-form',
  templateUrl: './new-user-form.component.html',
  styleUrls: ['./new-user-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxInputComponent,
    FormActionsComponent,
    AllowedAccessSectionComponent,
    MatButton,
    TestDirective,
    AuthSectionComponent,
    AdditionalDetailsSectionComponent,
  ],
  providers: [
    UserFormStore,
  ],
})
export class NewUserFormComponent implements OnInit {
  protected isStigMode = this.userFormStore.isStigMode;
  protected nextUid = this.userFormStore.nextUid;
  protected editingUser: User | undefined;

  protected isFormLoading = signal<boolean>(false);

  get isNewUser(): boolean {
    return !this.editingUser;
  }

  protected allowedAccessConfig = signal<AllowAccessConfig>({
    smbAccess: true,
    truenasAccess: {
      enabled: true,
      role: 'prompt',
    },
    sshAccess: false,
    shellAccess: false,
  });

  protected additionalDetails = signal<AdditionalDetailsConfig>({
    createGroup: true,
    groups: [],
    home: '',
    createHomeDirectory: false,
    defaultPermissions: true,
    fullName: '',
    email: null as string,
  });

  protected userAuthConfig = signal<UserAuthConfig>({
    allowSshLoginWithPassword: false,
    password: '',
    disablePassword: false,
    sshKey: '',
  });

  protected form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
  });

  protected readonly fakeTooltip = '';

  protected setAllowAccessConfig(config: AllowAccessConfig): void {
    this.allowedAccessConfig.set(config);
  }

  protected setAdditionalDetails(details: AdditionalDetailsConfig): void {
    this.additionalDetails.set(details);
  }

  protected setAuthConfig(auth: UserAuthConfig): void {
    this.userAuthConfig.set(auth);
  }

  constructor(
    private formBuilder: NonNullableFormBuilder,
    public slideInRef: SlideInRef<User | undefined, boolean>,
    private userFormStore: UserFormStore,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    // TODO: Handle enable/disable save button based on form sections validation status
    // TODO: Handle changes for `sshpubkey_file` input to set values on sshpubkey
    // TODO: Handle changes on `group` input to update shell options
    // TODO: Handle changes on `groups` input to update shell options
    // TODO: Handle changes on `home` input to set the value of `home_mode` input
    // TODO: Handle changes on `home_create` field to set the value for `home_mode` field
    // TODO: Add validator to `password_conf` field to match the value of `pasword` field
    // TODO: if editing user, handle setting values for `home_mode` depending on whether
    // `home` value is previously set or not
    // TODO: Handle setting disableWhile for
    // `locked` when `password_disabled`
    // `password` when `password_disabled`
    // `password_conf` when `password_disabled`
    // `group` when `group_create`
    // `sudo_commands` when `sudo_commands_all`
    // `sudo_commands_nopasswd` when `sudo_commands_nopasswd_all`

    // TODO: If editing user, set form values and
    // disable `uid` and `group_create`
    // if `user.immutable` is true for the user being edited
    // disable `group`, `home_mode`, `home`, `home_create` and `username`
    // if `user.builtin` is true, disable `smb`
    // set names already in user validator for `username`

    // TODO: if creating a new user,
    // set names already in user validator for `username`
    // set home share path by calling `sharing.smb.query`
    // get the next user id and set to uid
    // Set first shell option
    // detect full name changes to set username based on that
    // Handle setting disableWhile for
    // `password` when `password_disabled`
    // `password_conf` when `password_disabled`
    // `locked` when `password_disabled`

    this.editingUser = this.slideInRef.getData();
  }

  protected onSubmit(): void {
    const { username } = this.form.value;
    const {
      fullName,
      email,
      home,
      createHomeDirectory,
    } = this.additionalDetails();
    const { disablePassword, password } = this.userAuthConfig();

    const userCreatePayload: UserUpdate = {
      email,
      full_name: fullName || username,
      groups: [] as number[],
      home_create: createHomeDirectory,
      home: home || '/var/empty',
      locked: false,
      password_disabled: disablePassword,
      shell: '/usr/sbin/nologin',
      smb: this.allowedAccessConfig().smbAccess,
      ssh_password_enabled: false,
      sshpubkey: null as string,
      sudo_commands: [] as string[],
      sudo_commands_nopasswd: [] as string[],
      username,
      group_create: true,
      password,
      uid: this.nextUid(),
    };

    this.isFormLoading.set(true);
    this.userFormStore.createUser(userCreatePayload).pipe(
      catchError((error: unknown) => {
        this.dialogService.error(error);
        return of(undefined);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (user) => {
        this.isFormLoading.set(false);
        if (user) {
          this.slideInRef.close({ error: undefined, response: true });
        }
      },
    });
  }

  protected readonly tooltips = tooltips;
  protected readonly Role = Role;
}
