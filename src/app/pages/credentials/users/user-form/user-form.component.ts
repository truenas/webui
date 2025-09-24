import { ChangeDetectionStrategy, Component, computed, OnInit, signal, viewChild, inject } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { tooltips } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  catchError, combineLatest, distinctUntilChanged, filter, map, Observable, of,
  startWith,
  switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  hasShellAccess, hasSshAccess, hasTrueNasAccess, isEmptyHomeDirectory,
} from 'app/helpers/user.helper';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/user-form/auth-section/auth-section.component';
import { defaultHomePath, UserFormStore, UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user.store';
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
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
    RequiresRolesDirective,
  ],
  providers: [
    UserFormStore,
  ],
})
export class UserFormComponent implements OnInit {
  private formBuilder = inject(NonNullableFormBuilder);
  slideInRef = inject<SlideInRef<User | undefined, User>>(SlideInRef);
  private userFormStore = inject(UserFormStore);
  private formErrorHandler = inject(FormErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);

  protected isStigMode = this.userFormStore.isStigMode;
  protected editingUser = signal<User>(this.slideInRef.getData());

  protected isFormLoading = signal<boolean>(false);

  protected allowedAccessSection = viewChild.required(AllowedAccessSectionComponent);
  protected authSection = viewChild.required(AuthSectionComponent);
  protected additionalDetailsSection = viewChild.required(AdditionalDetailsSectionComponent);

  protected isFormInvalid = signal<boolean>(false);

  protected readonly tooltips = tooltips;
  protected readonly Role = Role;
  protected readonly fakeTooltip = '';
  protected readonly requiredRoles = [Role.AccountWrite];

  protected form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
  });

  protected isNewUser = computed(() => {
    return !this.editingUser();
  });

  protected get formValues(): UserUpdate & { stig_password?: UserStigPasswordOption } {
    return {
      ...this.form.value,
      ...this.allowedAccessSection().form.value,
      ...this.authSection().form.value,
      ...this.additionalDetailsSection().form.value,
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

  protected getHomeCreateWarning(): TranslatedString {
    const homeCreate = this.formValues.home_create;
    const home = this.formValues.home;
    const homeMode = this.formValues.home_mode;
    if (this.editingUser()) {
      if (this.editingUser().immutable || isEmptyHomeDirectory(home)) {
        return '';
      }
      if (!homeCreate && this.editingUser().home !== home) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: `'${String(home)}'` },
        );
      }
      if (!homeCreate && !!homeMode && this.userFormStore.homeModeOldValue() !== homeMode) {
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
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty || this.authSection().form.dirty || this.allowedAccessSection().form.dirty
        || this.additionalDetailsSection().form.dirty);
    });
    this.setupUsernameUpdate();
  }

  ngOnInit(): void {
    this.setupForm();
    this.setupAccessWatchers();
  }

  private setupForm(): void {
    this.listenForAllFormsValidity();

    if (this.editingUser()) {
      this.setupEditUserForm(this.editingUser());
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
      truenasAccess: hasTrueNasAccess(user),
      shellAccess: hasShellAccess(user),
      sshAccess: hasSshAccess(user),
    });

    this.setNamesInUseValidator(user.username);
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

  private setupUsernameUpdate(): void {
    this.form.controls.username.valueChanges.pipe(
      untilDestroyed(this),
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
      untilDestroyed(this),
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
        && prev?.truenasAccess === curr?.truenasAccess),
      untilDestroyed(this),
    ).subscribe(() => {
      // Force form validation recalculation for all forms
      this.reloadFormValidationState();
    });
  }

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
      fieldsToClear.push(
        'shell',
        'sudo_commands',
        'sudo_commands_all',
        'sudo_commands_nopasswd',
        'sudo_commands_nopasswd_all',
      );
    }

    // SSH Access controls: ssh-related fields
    if (!allowedAccess.sshAccess) {
      fieldsToClear.push(
        'sshpubkey',
        'ssh_password_enabled',
      );
    }

    // SMB Access controls: password disable field (shown when SMB is disabled)
    // Note: password_disabled is shown when smbAccess is FALSE

    // Clear validation errors for fields that are no longer relevant
    this.formErrorHandler.clearValidationErrorsForHiddenFields(this.allForms, fieldsToClear);

    // Update validation for all forms to recalculate based on current access settings
    this.allForms.forEach((form) => {
      form.updateValueAndValidity();
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
    this.isFormLoading.set(true);

    return this.editingUser()
      ? this.userFormStore.updateUser(this.editingUser().id, payload)
      : this.userFormStore.createUser();
  }

  protected onSubmit(): void {
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

    this.getHomeCreateConfirmation().pipe(
      filter(Boolean),
      switchMap(() => this.submitUserRequest(payload)),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.allForms);
        return of(undefined);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (user) => {
        this.isFormLoading.set(false);
        if (user) {
          this.slideInRef.close({ response: user });

          if (this.isNewUser()) {
            this.snackbar.success(this.translate.instant('User created'));
          } else {
            this.snackbar.success(this.translate.instant('User updated'));
          }
        }
      },
    });
  }

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
      untilDestroyed(this),
    ).subscribe((isInvalid) => this.isFormInvalid.set(isInvalid));
  }
}
