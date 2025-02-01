import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
  signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  from, Observable, of, Subscription,
} from 'rxjs';
import {
  debounceTime, filter, map, switchMap, take,
} from 'rxjs/operators';
import { allCommands } from 'app/constants/all-commands.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextUsers } from 'app/helptext/account/user-form';
import { Option } from 'app/interfaces/option.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxSlideToggleComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialogComponent } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import { userAdded, userChanged } from 'app/pages/credentials/users/store/user.actions';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';

const defaultHomePath = '/var/empty';

export enum UserStigPasswordOption {
  DisablePassword = 'DISABLE_PASSWORD',
  OneTimePassword = 'ONE_TIME_PASSWORD',
}

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSlideToggleComponent,
    MatDivider,
    IxChipsComponent,
    IxComboboxComponent,
    IxRadioGroupComponent,
    IxExplorerComponent,
    IxPermissionsComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
    IxFileInputComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class UserFormComponent implements OnInit {
  isFormLoading = false;
  subscriptions: Subscription[] = [];
  homeModeOldValue = '';
  protected readonly requiredRoles = [Role.AccountWrite];
  protected editingUser: User | undefined;
  isStigMode = signal<boolean>(false);

  get isNewUser(): boolean {
    return !this.editingUser;
  }

  get smbTooltip(): string {
    if (this.isStigMode()) {
      return this.translate.instant(this.tooltips.smbStig);
    }

    return this.isEditingBuiltinUser
      ? this.translate.instant(this.tooltips.smbBuiltin)
      : this.translate.instant(this.tooltips.smb);
  }

  get title(): string {
    return this.isNewUser ? this.translate.instant('Add User') : this.translate.instant('Edit User');
  }

  get isEditingBuiltinUser(): boolean {
    return !this.isNewUser && Boolean(this.editingUser?.builtin);
  }

  form = this.fb.group({
    full_name: ['', [Validators.required]],
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
    email: ['', [emailValidator()]],
    password: ['', [
      this.validatorsService.validateOnCondition(
        () => this.isNewUser,
        Validators.required,
      ),
    ]],
    password_conf: ['', [
      this.validatorsService.validateOnCondition(
        () => this.isNewUser,
        Validators.required,
      ),
    ]],
    stig_password: [UserStigPasswordOption.DisablePassword],
    uid: [null as number, [Validators.required]],
    group: [null as number],
    group_create: [true],
    groups: [[] as number[]],
    home: [defaultHomePath, []],
    home_mode: ['700'],
    home_create: [false],
    sshpubkey: [null as string],
    sshpubkey_file: [null as File[]],
    password_disabled: [false],
    shell: [null as string],
    locked: [false],
    sudo_commands: [[] as string[]],
    sudo_commands_all: [false],
    sudo_commands_nopasswd: [[] as string[]],
    sudo_commands_nopasswd_all: [false],
    smb: [true],
    ssh_password_enabled: [false],
  });

  readonly tooltips = {
    full_name: helptextUsers.user_form_full_name_tooltip,
    username: helptextUsers.user_form_username_tooltip,
    email: helptextUsers.user_form_email_tooltip,
    password: helptextUsers.user_form_password_tooltip,
    password_edit: helptextUsers.user_form_password_edit_tooltip,
    password_conf_edit: helptextUsers.user_form_password_edit_tooltip,
    uid: helptextUsers.user_form_uid_tooltip,
    group: helptextUsers.user_form_primary_group_tooltip,
    group_create: helptextUsers.user_form_group_create_tooltip,
    groups: helptextUsers.user_form_aux_groups_tooltip,
    home: helptextUsers.user_form_dirs_explorer_tooltip,
    home_mode: helptextUsers.user_form_home_dir_permissions_tooltip,
    home_create: helptextUsers.user_form_home_create_tooltip,
    sshpubkey: helptextUsers.user_form_auth_sshkey_tooltip,
    password_disabled: helptextUsers.user_form_auth_pw_enable_tooltip,
    one_time_password: helptextUsers.user_form_auth_one_time_pw_tooltip,
    shell: helptextUsers.user_form_shell_tooltip,
    locked: helptextUsers.user_form_lockuser_tooltip,
    smb: helptextUsers.user_form_smb_tooltip,
    smbBuiltin: helptextUsers.smbBuiltin,
    smbStig: helptextUsers.smbStig,
  };

  readonly groupOptions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.id }))),
  );

  shellOptions$: Observable<Option[]>;
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly groupProvider = new SimpleAsyncComboboxProvider(this.groupOptions$);

  autocompleteProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['name', '^', query], ['local', '=', true]]]).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  protected stigPasswordOptions$ = of([
    {
      label: this.translate.instant('Disable Password'),
      value: UserStigPasswordOption.DisablePassword,
      tooltip: this.tooltips.password_disabled,
    },
    {
      label: this.translate.instant('Generate Temporary One-Time Password'),
      value: UserStigPasswordOption.OneTimePassword,
      tooltip: this.tooltips.one_time_password,
    },
  ]);

  get homeCreateWarning(): string {
    const homeCreate = this.form.value.home_create;
    const home = this.form.value.home;
    const homeMode = this.form.value.home_mode;
    if (this.editingUser) {
      if (this.editingUser.immutable || home === defaultHomePath) {
        return '';
      }
      if (!homeCreate && this.editingUser.home !== home) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: '\'' + this.form.value.home + '\'' },
        );
      }
      if (!homeCreate && !!homeMode && this.homeModeOldValue !== homeMode) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: '\'' + this.form.value.home + '\'' },
        );
      }
    } else if (!homeCreate && home !== defaultHomePath) {
      return this.translate.instant(
        'With this configuration, the existing directory {path} will be used as a home directory without creating a new directory for the user.',
        { path: '\'' + this.form.value.home + '\'' },
      );
    }
    return '';
  }

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private storageService: StorageService,
    private downloadService: DownloadService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private matDialog: MatDialog,
    private userService: UserService,
    public slideInRef: SlideInRef<User | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingUser = this.slideInRef.getData();

    this.form.controls.smb.errors$.pipe(
      filter((error) => error?.manualValidateErrorMsg),
      switchMap(() => this.form.controls.password.valueChanges),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.form.controls.smb.invalid) {
        this.form.controls.smb.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.setupForm();

    this.api.call('system.security.config').pipe(untilDestroyed(this)).subscribe((config) => {
      this.isStigMode.set(config.enable_gpos_stig);

      if (this.isStigMode()) {
        this.handleUserWhenStigMode();
      }
    });
  }

  setupForm(): void {
    this.form.controls.sshpubkey_file.valueChanges.pipe(
      switchMap((files: File[]) => {
        return !files?.length ? of('') : from(files[0].text());
      }),
      untilDestroyed(this),
    ).subscribe((key) => {
      this.form.controls.sshpubkey.setValue(key);
    });

    this.form.controls.group.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((group) => {
      this.updateShellOptions(group, this.form.value.groups);
    });

    this.form.controls.groups.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((groups) => {
      this.updateShellOptions(this.form.value.group, groups);
    });

    this.form.controls.home.valueChanges.pipe(untilDestroyed(this)).subscribe((home) => {
      if (home === defaultHomePath || this.editingUser?.immutable) {
        this.form.controls.home_mode.disable();
      } else {
        this.form.controls.home_mode.enable();
      }
    });

    this.form.controls.home_create.valueChanges.pipe(untilDestroyed(this)).subscribe((checked) => {
      if (checked) {
        this.form.patchValue({ home_mode: '700' });
      }
    });

    this.form.addValidators(
      matchOthersFgValidator(
        'password_conf',
        ['password'],
        this.translate.instant(this.isNewUser ? 'Password and confirmation should match.' : 'New password and confirmation should match.'),
      ),
    );

    if (this.editingUser?.home && this.editingUser.home !== defaultHomePath) {
      this.storageService.filesystemStat(this.editingUser.home)
        .pipe(this.errorHandler.catchError(), untilDestroyed(this))
        .subscribe((stat) => {
          this.form.patchValue({ home_mode: stat.mode.toString(8).substring(2, 5) });
          this.homeModeOldValue = stat.mode.toString(8).substring(2, 5);
        });
    } else {
      this.form.patchValue({ home_mode: '700' });
      this.form.controls.home_mode.disable();
    }
    this.subscriptions.push(
      this.form.controls.locked.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.password.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.password_conf.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.group.disabledWhile(this.form.controls.group_create.value$),
      this.form.controls.sudo_commands.disabledWhile(this.form.controls.sudo_commands_all.value$),
      this.form.controls.sudo_commands_nopasswd.disabledWhile(this.form.controls.sudo_commands_nopasswd_all.value$),
    );

    if (this.editingUser) {
      this.setupEditUserForm(this.editingUser);
    } else {
      this.setupNewUserForm();
    }
  }

  handleUserWhenStigMode(): void {
    this.form.controls.smb.patchValue(false);
    this.form.controls.smb.disable();

    if (!this.editingUser) {
      this.form.controls.password.disable();
      this.form.controls.password_conf.disable();

      this.subscriptions.push(
        this.form.controls.locked.disabledWhile(
          this.form.controls.stig_password.value$
            .pipe(map((option) => option === UserStigPasswordOption.DisablePassword)),
        ),
      );
    }
  }

  onSubmit(): void {
    const payload = this.getPayload();

    const homeCreateConfirmation$ = this.getHomeCreateConfirmation();

    homeCreateConfirmation$
      .pipe(
        filter(Boolean),
        switchMap(() => this.submitUserRequest(payload)),
        untilDestroyed(this),
      )
      .subscribe({
        next: (user) => {
          if (this.isNewUser) {
            this.snackbar.success(this.translate.instant('User added'));
            this.store$.dispatch(userAdded({ user }));
          } else {
            this.snackbar.success(this.translate.instant('User updated'));
            this.store$.dispatch(userChanged({ user }));
          }
          this.isFormLoading = false;
          this.slideInRef.close({ response: true, error: null });
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private getPayload(): UserUpdate {
    const values = this.form.value;

    const disablePassword = this.isStigMode() && this.isNewUser
      ? values.stig_password === UserStigPasswordOption.DisablePassword
      : values.password_disabled;

    return {
      email: values.email ? values.email : null,
      full_name: values.full_name,
      group: values.group,
      groups: values.groups,
      home_mode: this.homeModeOldValue !== values.home_mode ? values.home_mode : undefined,
      home_create: values.home_create,
      home: values.home,
      locked: disablePassword ? false : values.locked,
      password_disabled: disablePassword,
      shell: values.shell,
      smb: values.smb || false,
      ssh_password_enabled: values.ssh_password_enabled,
      sshpubkey: values.sshpubkey ? values.sshpubkey.trim() : values.sshpubkey,
      sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
      sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
      username: values.username,
    };
  }

  private getHomeCreateConfirmation(): Observable<boolean> {
    if (this.homeCreateWarning) {
      return this.dialog.confirm({
        title: this.translate.instant('Warning!'),
        message: this.homeCreateWarning,
      });
    }
    return of(true);
  }

  private generateOneTimePasswordIfNeeded(user: User): Observable<User> {
    if (this.isNewUser && this.form.value.stig_password === UserStigPasswordOption.OneTimePassword) {
      return this.api.call('auth.generate_onetime_password', [{ username: this.form.value.username }]).pipe(
        switchMap((password) => {
          this.matDialog.open(OneTimePasswordCreatedDialogComponent, { data: password });
          return of(user);
        }),
      );
    }
    return of(user);
  }

  private submitUserRequest(payload: UserUpdate): Observable<User> {
    this.isFormLoading = true;
    this.cdr.markForCheck();

    return this.editingUser ? this.getUpdateUserRequest(payload) : this.getCreateUserRequest(payload);
  }

  private getCreateUserRequest(payload: UserUpdate): Observable<User> {
    const oneTimePassword = this.form.value.stig_password === UserStigPasswordOption.OneTimePassword;

    const userPayload = {
      ...payload,
      group_create: this.form.value.group_create,
      password: oneTimePassword || payload.password_disabled ? null : this.form.value.password,
      random_password: oneTimePassword,
      uid: this.form.value.uid,
    };

    if (!oneTimePassword) {
      delete userPayload.random_password;
    }

    return this.api.call('user.create', [userPayload]).pipe(
      switchMap((user) => this.generateOneTimePasswordIfNeeded(user)),
    );
  }

  private getUpdateUserRequest(payload: UserUpdate): Observable<User> {
    const values = this.form.value;

    const passwordNotEmpty = values.password !== '' && values.password_conf !== '';
    if (passwordNotEmpty && !values.password_disabled) {
      payload.password = values.password;
    }

    if (payload.home_create) {
      return this.api.call('user.update', [
        this.editingUser.id,
        { home_create: true, home: payload.home },
      ]).pipe(
        switchMap(() => {
          delete payload.home_create;
          delete payload.home;
          return this.api.call('user.update', [this.editingUser.id, payload]);
        }),
      );
    }
    return this.api.call('user.update', [this.editingUser.id, payload]);
  }

  onDownloadSshPublicKey(): void {
    const name = this.form.controls.username.value;
    const key = this.form.controls.sshpubkey.value;
    const blob = new Blob([key], { type: 'text/plain' });
    this.downloadService.downloadBlob(blob, `${name}_public_key_rsa`);
  }

  private setupNewUserForm(): void {
    this.setNamesInUseValidator();
    this.setHomeSharePath();
    this.setNextUserId();
    this.setFirstShellOption();
    this.detectFullNameChanges();

    this.subscriptions.push(
      this.form.controls.password.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.password_conf.disabledWhile(this.form.controls.password_disabled.value$),
      this.form.controls.locked.disabledWhile(this.form.controls.password_disabled.value$),
    );
  }

  private setupEditUserForm(user: User): void {
    this.form.patchValue({
      email: user.email,
      full_name: user.full_name,
      group_create: false,
      group: user.group.id,
      groups: user.groups,
      home: user.home,
      locked: user.locked,
      password_disabled: user.password_disabled,
      shell: user.shell,
      smb: user.smb,
      sshpubkey: user.sshpubkey,
      ssh_password_enabled: user.ssh_password_enabled,
      sudo_commands: user.sudo_commands?.includes(allCommands) ? [] : user.sudo_commands,
      sudo_commands_all: user.sudo_commands?.includes(allCommands),
      sudo_commands_nopasswd: user.sudo_commands_nopasswd?.includes(allCommands) ? [] : user.sudo_commands_nopasswd,
      sudo_commands_nopasswd_all: user.sudo_commands_nopasswd?.includes(allCommands),
      uid: user.uid,
      username: user.username,
    });

    this.form.controls.uid.disable();
    this.form.controls.group_create.disable();

    if (user.immutable) {
      this.form.controls.group.disable();
      this.form.controls.home_mode.disable();
      this.form.controls.home.disable();
      this.form.controls.home_create.disable();
      this.form.controls.username.disable();
    }

    if (user.builtin) {
      this.form.controls.smb.disable();
    }

    this.setNamesInUseValidator(user.username);
  }

  private detectFullNameChanges(): void {
    this.form.controls.full_name.valueChanges.pipe(
      map((fullName) => this.getUserName(fullName)),
      filter((username) => !!username),
      untilDestroyed(this),
    ).subscribe((username) => {
      this.form.patchValue({ username });
      this.form.controls.username.markAsTouched();
    });
  }

  private setHomeSharePath(): void {
    this.api.call('sharing.smb.query', [[
      ['enabled', '=', true],
      ['home', '=', true],
    ]]).pipe(
      filter((shares) => !!shares?.length),
      map((shares) => shares[0].path),
      untilDestroyed(this),
    ).subscribe((homeSharePath) => {
      this.form.patchValue({ home: homeSharePath });
    });
  }

  private setNextUserId(): void {
    this.api.call('user.get_next_uid').pipe(untilDestroyed(this)).subscribe((nextUid) => {
      this.form.patchValue({ uid: nextUid });
    });
  }

  private setFirstShellOption(): void {
    this.api.call('user.shell_choices', [this.form.value.groups]).pipe(
      choicesToOptions(),
      filter((shells) => !!shells.length),
      map((shells) => shells[0].value),
      untilDestroyed(this),
    ).subscribe((firstShell: string) => {
      this.form.patchValue({ shell: firstShell });
    });
  }

  private setNamesInUseValidator(currentName?: string): void {
    this.store$.select(selectUsers).pipe(untilDestroyed(this)).subscribe((users) => {
      let forbiddenNames = users.map((user) => user.username);
      if (currentName) {
        forbiddenNames = forbiddenNames.filter((name) => name !== currentName);
      }
      this.form.controls.username.addValidators(forbiddenValues(forbiddenNames));
    });
  }

  private getUserName(fullName: string): string {
    let username: string;
    const formatted = fullName.trim().split(/[\s,]+/);
    if (formatted.length === 1) {
      username = formatted[0];
    } else {
      username = formatted[0][0] + formatted.pop();
    }
    if (username.length >= 8) {
      username = username.substring(0, 8);
    }

    return username.toLocaleLowerCase();
  }

  private updateShellOptions(group: number, groups: number[]): void {
    const ids = new Set<number>(groups);
    if (group) {
      ids.add(group);
    }

    this.api.call('user.shell_choices', [Array.from(ids)])
      .pipe(choicesToOptions(), take(1), untilDestroyed(this))
      .subscribe((options) => {
        this.shellOptions$ = of(options);
        this.cdr.markForCheck();
      });
  }
}
