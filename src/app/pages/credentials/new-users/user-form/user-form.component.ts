import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Role } from 'app/enums/role.enum';
import {
  hasShellAccess, hasSshAccess, hasTrueNasAccess, isEmptyHomeDirectory,
} from 'app/helpers/user.helper';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { defaultHomePath, defaultRole, UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  ],
  providers: [
    UserFormStore,
  ],
})
export class UserFormComponent implements OnInit {
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

  protected readonly formValues = computed(() => {
    return {
      ...this.form.value,
      ...this.allowedAccessSection().form.value,
      ...this.authSection().form.value,
      ...this.additionalDetailsSection().form.value,
    };
  });

  protected homeCreateWarning = computed<TranslatedString>(() => {
    const homeCreate = this.formValues().home_create;
    const home = this.formValues().home;
    const homeMode = this.formValues().home_mode;
    if (this.editingUser()) {
      if (this.editingUser().immutable || isEmptyHomeDirectory(home)) {
        return '';
      }
      if (!homeCreate && this.editingUser().home !== home) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: `'${home}'` },
        );
      }
      if (!homeCreate && !!homeMode && this.userFormStore.homeModeOldValue() !== homeMode) {
        return this.translate.instant(
          'Operation will change permissions on path: {path}',
          { path: `'${home}'` },
        );
      }
    } else if (!homeCreate && home !== defaultHomePath) {
      return this.translate.instant(
        'With this configuration, the existing directory {path} will be used as a home directory without creating a new directory for the user.',
        { path: `'${home}'` },
      );
    }
    return '';
  });

  constructor(
    private formBuilder: NonNullableFormBuilder,
    public slideInRef: SlideInRef<User | undefined, User>,
    private userFormStore: UserFormStore,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private translate: TranslateService,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty || this.authSection().form.dirty || this.allowedAccessSection().form.dirty
        || this.additionalDetailsSection().form.dirty);
    });
    this.setupUsernameUpdate();
  }

  ngOnInit(): void {
    this.setupForm();
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

    const role = user.roles?.length > 0 ? user.roles[0] : defaultRole;

    this.userFormStore.updateSetupDetails({ role });

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

  private getHomeCreateConfirmation(): Observable<boolean> {
    if (this.homeCreateWarning()) {
      return this.dialog.confirm({
        title: this.translate.instant('Warning!'),
        message: this.homeCreateWarning(),
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
    const values = { ...this.formValues() };
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
        this.errorHandler.showErrorModal(error);
        return of(undefined);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (user) => {
        this.isFormLoading.set(false);
        if (user) {
          this.slideInRef.close({ response: user });
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
