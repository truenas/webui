import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, input, OnInit, signal, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent, TnInputComponent } from '@truenas/ui-components';
import {
  combineLatest, distinctUntilChanged, filter, map, Observable, of,
  startWith,
  switchMap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  hasShellAccess, hasSshAccess, hasTrueNasAccess, isEmptyHomeDirectory,
} from 'app/helpers/user.helper';
import { User, UserFormPreset, UserUpdate } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/user-form/auth-section/auth-section.component';
import { defaultHomePath, UserFormStore, UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user.store';
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    TnFormSectionComponent,
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnInputComponent,
    AllowedAccessSectionComponent,
    AuthSectionComponent,
    AdditionalDetailsSectionComponent,
  ],
  providers: [
    UserFormStore,
  ],
})
export class UserFormComponent extends IxFormHostForm<User> implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  private userFormStore = inject(UserFormStore);
  private formErrorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** Record being edited, supplied by the `<tn-side-panel>` host via the `editUser` input. */
  readonly editUser = input<User | undefined>(undefined);

  /**
   * What a create flow wants this form to start as, for an account that is not
   * a general-purpose one — see {@link UserFormPreset}. Ignored while editing.
   *
   * Handed straight to the sections that own the controls it names; this form
   * holds only the username. The two halves coordinate through the store, as
   * everything else here does: SMB access going off is what lets the auth
   * section tick "Disable Password" at all.
   */
  readonly preset = input<UserFormPreset | undefined>(undefined);

  protected isStigMode = this.userFormStore.isStigMode;
  // The host applies the `editUser` input after construction, so the edited record is
  // resolved in ngOnInit rather than eagerly here.
  protected editingUser = signal<User | undefined>(undefined);

  protected allowedAccessSection = viewChild.required(AllowedAccessSectionComponent);
  protected authSection = viewChild.required(AuthSectionComponent);
  protected additionalDetailsSection = viewChild.required(AdditionalDetailsSectionComponent);

  protected isFormInvalid = signal<boolean>(false);

  // Signals to track home directory and shell for validation
  protected homeDirectory = signal<string>(defaultHomePath);
  protected shell = signal<string | null>(null);
  protected password = signal<string>('');
  protected passwordDisabled = signal<boolean>(false);

  protected readonly Role = Role;
  protected readonly requiredRoles = [Role.AccountWrite];

  protected readonly form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
  });

  /**
   * Widened: the inner `<ix-form>` only owns the username group, but Save must also wait on the
   * three projected sub-forms tracked by {@link isFormInvalid}.
   */
  override canSubmit(): boolean {
    return !this.isFormInvalid() && super.canSubmit();
  }

  protected isNewUser = computed(() => {
    return !this.editingUser();
  });

  protected get formValues(): UserUpdate & { stig_password?: UserStigPasswordOption } {
    return {
      ...this.form.getRawValue(),
      ...this.allowedAccessSection().form.getRawValue(),
      ...this.authSection().form.getRawValue(),
      ...this.additionalDetailsSection().form.getRawValue(),
    };
  }

  /**
   * Get all form instances for error handling - allows FormErrorHandlerService
   * to find the correct original form control instead of the combined one
   */
  protected get allForms(): FormGroup[] {
    return [
      this.form,
      this.allowedAccessSection().form,
      this.authSection().form,
      this.additionalDetailsSection().form,
    ];
  }

  /**
   * Whether the edit form's home fields differ from what the record was loaded with.
   *
   * `user.update` acts on every home key it is given: a `home` that differs relocates the account
   * and copies the old directory over (`user.do_home_copy`), and a `home_mode` re-applies
   * permissions on it (`filesystem.setperm`, stripping ACLs). So an untouched home must leave the
   * payload entirely — see {@link handleSubmit} — or saving an unrelated change would move and
   * re-permission the user's home.
   */
  private hasHomeDirectoryChanges(editingUser: User): boolean {
    const homeCreate = this.formValues.home_create;
    const home = this.formValues.home;
    const homeMode = this.formValues.home_mode;
    // Empty while the directory's current mode is still being read (or could not be read at all):
    // permissions we never learned are not permissions the user changed.
    const loadedHomeMode = this.userFormStore.homeModeOldValue();

    return Boolean(homeCreate)
      || home !== editingUser.home
      || (!!homeMode && !!loadedHomeMode && loadedHomeMode !== homeMode);
  }

  protected getHomeCreateWarning(): TranslatedString {
    const homeCreate = this.formValues.home_create;
    const home = this.formValues.home;
    const editingUser = this.editingUser();
    if (editingUser) {
      if (editingUser.immutable || isEmptyHomeDirectory(home) || homeCreate) {
        return '';
      }
      if (this.hasHomeDirectoryChanges(editingUser)) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: `'${String(home)}'` },
        );
      }
    } else if (!homeCreate && home !== defaultHomePath) {
      return this.translate.instant(
        'With this configuration, the existing directory {path} will be used as a home directory without creating a new directory for the user.',
        { path: `'${String(home)}'` },
      );
    }
    return '';
  }

  constructor() {
    super();
    this.setupUsernameUpdate();
  }

  /** Composite dirty across all four sub-forms; drives both hosts' discard confirmation. */
  override hasUnsavedChanges(): boolean {
    return super.hasUnsavedChanges()
      || this.authSection().form.dirty
      || this.allowedAccessSection().form.dirty
      || this.additionalDetailsSection().form.dirty;
  }

  ngOnInit(): void {
    // The panel host applies `editUser` after construction; pick it up here.
    this.editingUser.set(this.editUser());
    this.setupForm();
    this.setupAccessWatchers();
    this.setupHomeAndShellWatchers();
  }

  private setupForm(): void {
    this.listenForAllFormsValidity();

    if (this.editingUser()) {
      this.setupEditUserForm(this.editingUser());
    } else {
      // A new user has no name of its own to exclude, which is what the
      // optional argument is for. Without this the clash is only caught by
      // middleware, after a round trip — the edit form catches it as you type.
      //
      // The list it reads is filled by `userPageEntered`, which only the Users
      // page dispatches. Opened from a picker (`UserDirectoryService.createUser`)
      // it validates against whatever that left in the root store — nothing at
      // all in a session that never visited the page, otherwise a list kept
      // current only by the add/change/remove actions. An async validator over
      // `user.query` would answer for both entry points.
      this.setNamesInUseValidator();
    }
  }

  private setupEditUserForm(user: User): void {
    this.form.patchValue({
      username: user.username,
    });

    if (user.immutable) {
      this.form.controls.username.disable();
    }

    this.userFormStore.updateUserConfig({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      smb: user.smb,
      webshare: user.webshare,
      home: user.home,
      uid: user.uid,
      group: user.group.id,
      groups: user.groups,
      password_disabled: user.password_disabled,
      sshpubkey: user.sshpubkey,
      ssh_password_enabled: user.ssh_password_enabled,
      shell: user.shell,
      locked: user.locked,
      sudo_commands: user.sudo_commands,
      sudo_commands_nopasswd: user.sudo_commands_nopasswd,
    });

    this.userFormStore.setAllowedAccessConfig({
      smbAccess: user.smb,
      webshareAccess: user.webshare,
      truenasAccess: hasTrueNasAccess(user),
      shellAccess: hasShellAccess(user),
      sshAccess: hasSshAccess(user),
    });

    this.setNamesInUseValidator(user.username);
  }

  /** The last names-in-use validator added, so the next emission can replace it. */
  private namesInUseValidator: ValidatorFn | undefined;

  private setNamesInUseValidator(currentName?: string): void {
    this.store$.select(selectUsers).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((users) => {
      let forbiddenNames = users.map((user) => user.username);
      if (currentName) {
        forbiddenNames = forbiddenNames.filter((name) => name !== currentName);
      }

      const username = this.form.controls.username;

      // Replace rather than append: the list emits again whenever it reloads,
      // and a stacked validator goes on forbidding names that have since been
      // deleted. Revalidate too, because the list can land after a name has
      // already been typed — on the create form, before the user reaches Save.
      //
      // Events are emitted, not suppressed: the field's error message renders
      // off `statusChanges`, so a silent update clears the error without
      // clearing the message. The value is unchanged, so the `valueChanges`
      // that comes with it re-pushes the same username and is absorbed
      // downstream.
      if (this.namesInUseValidator) {
        username.removeValidators(this.namesInUseValidator);
      }
      this.namesInUseValidator = forbiddenValues(forbiddenNames);
      username.addValidators(this.namesInUseValidator);
      username.updateValueAndValidity();
    });
  }

  private setupUsernameUpdate(): void {
    this.form.controls.username.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (username) => {
        this.userFormStore.updateUserConfig({
          username,
        });
      },
    });

    this.userFormStore.state$.pipe(
      map((state) => state?.userConfig?.username),
      filter(Boolean),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((username) => {
      this.form.patchValue({ username });
    });
  }

  /**
   * Setup watchers for all access types to reload form validation when access changes
   */
  private setupAccessWatchers(): void {
    // Watch for changes in all access configurations
    this.userFormStore.state$.pipe(
      map((state) => state?.setupDetails?.allowedAccess),
      distinctUntilChanged((prev, curr) => prev?.shellAccess === curr?.shellAccess
        && prev?.sshAccess === curr?.sshAccess
        && prev?.smbAccess === curr?.smbAccess
        && prev?.webshareAccess === curr?.webshareAccess
        && prev?.truenasAccess === curr?.truenasAccess),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      // Force form validation recalculation for all forms
      this.reloadFormValidationState();
    });
  }

  /**
   * Setup watchers for home directory and shell to update signals for auth validation
   */
  private setupHomeAndShellWatchers(): void {
    this.additionalDetailsSection().form.controls.home.valueChanges.pipe(
      startWith(this.additionalDetailsSection().form.controls.home.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((home) => {
      this.homeDirectory.set(home || defaultHomePath);
    });

    this.additionalDetailsSection().form.controls.shell.valueChanges.pipe(
      startWith(this.additionalDetailsSection().form.controls.shell.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((shell) => {
      this.shell.set(shell);
    });

    // Watch password and password_disabled for SMB validation
    this.authSection().form.controls.password.valueChanges.pipe(
      startWith(this.authSection().form.controls.password.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((pwd) => {
      this.password.set(pwd || '');
    });

    this.authSection().form.controls.password_disabled.valueChanges.pipe(
      startWith(this.authSection().form.controls.password_disabled.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((disabled) => {
      this.passwordDisabled.set(disabled || false);
    });
  }

  // Field names that need validation clearing based on access type
  private readonly shellAccessFields = [
    'shell',
    'sudo_commands',
    'sudo_commands_all',
    'sudo_commands_nopasswd',
    'sudo_commands_nopasswd_all',
  ] as const;

  private readonly sshAccessFields = [
    'sshpubkey',
    'ssh_password_enabled',
  ] as const;

  /**
   * Reload validation state for all forms to ensure proper validation after access changes
   */
  private reloadFormValidationState(): void {
    // Get current access state to determine which fields should be cleared
    const allowedAccess = this.userFormStore.state()?.setupDetails?.allowedAccess;
    if (!allowedAccess) return;

    // Collect field names that should have their validation errors cleared based on hidden sections
    const fieldsToClear: string[] = [];

    // Shell Access controls: shell field and all sudo command fields
    if (!allowedAccess.shellAccess) {
      fieldsToClear.push(...this.shellAccessFields);
    }

    // SSH Access controls: ssh-related fields
    if (!allowedAccess.sshAccess) {
      fieldsToClear.push(...this.sshAccessFields);
    }

    // SMB Access controls: password disable field (shown when SMB is disabled)
    // Note: password_disabled is shown when smbAccess is FALSE

    // Clear validation errors for fields that are no longer relevant
    this.formErrorHandler.clearValidationErrorsForHiddenFields(this.allForms, fieldsToClear);

    // Update validation for all forms to recalculate based on current access settings
    // Use emitEvent: false to prevent unnecessary validation cascades
    this.allForms.forEach((form) => {
      form.updateValueAndValidity({ emitEvent: false });
    });
  }

  private getHomeCreateConfirmation(): Observable<boolean> {
    const warning = this.getHomeCreateWarning();
    if (warning) {
      return this.dialog.confirm({
        title: this.translate.instant('Warning!'),
        message: warning,
      });
    }
    return of(true);
  }

  private submitUserRequest(payload: UserUpdate): Observable<User> {
    const editingUser = this.editingUser();
    return editingUser
      ? this.userFormStore.updateUser(editingUser.id, payload)
      : this.userFormStore.createUser();
  }

  protected handleSubmit = (): SubmitResult<User, User> => {
    const values = { ...this.formValues };
    let payload = { ...this.userFormStore.userConfig() };

    const disablePassword = this.isStigMode() && this.isNewUser()
      ? values.stig_password === UserStigPasswordOption.DisablePassword
      : values.password_disabled;

    payload = {
      ...payload,
      locked: disablePassword ? false : payload.locked,
      password_disabled: disablePassword,
    };

    if (!payload.password) {
      delete payload.password;
    }

    const editingUser = this.editingUser();
    if (editingUser && !this.hasHomeDirectoryChanges(editingUser)) {
      // Nothing home-related was touched, so say nothing about it: `user.update` would otherwise
      // act on the keys it is handed, relocating and re-permissioning the home directory on a save
      // that was only meant to change, say, shell access.
      delete payload.home;
      delete payload.home_create;
      delete payload.home_mode;
    }

    return {
      // Declining the home-directory warning completes without emitting, which `<ix-form>` reads as
      // "nothing happened": no snackbar, no close, Save re-enables.
      request$: this.getHomeCreateConfirmation().pipe(
        filter(Boolean),
        switchMap(() => this.submitUserRequest(payload)),
      ),
      successMessage: this.isNewUser()
        ? this.translate.instant('User created')
        : this.translate.instant('User updated'),
      // Field errors can belong to any of the four sub-forms; the wrapper's default handler only
      // knows the one group it owns, so map them across all of them here.
      onError: (error) => {
        this.formErrorHandler.handleValidationErrors(error, this.allForms);
        return true;
      },
      // Hand the created/updated record back to the opener. Most callers just reload, but some
      // (e.g. the API key form's "Add New" username) select the returned User.
      closeWith: (user) => user,
    };
  };

  private listenForAllFormsValidity(): void {
    const forms = [
      this.form,
      this.allowedAccessSection().form,
      this.authSection().form,
      this.additionalDetailsSection().form,
    ];

    const statusObservables = forms.map((formGroup) => formGroup.statusChanges.pipe(
      startWith(formGroup.status),
      distinctUntilChanged(),
      map(() => formGroup.invalid),
    ));

    combineLatest(statusObservables).pipe(
      map((invalidArray) => invalidArray.some(Boolean)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isInvalid) => this.isFormInvalid.set(isInvalid));
  }
}
