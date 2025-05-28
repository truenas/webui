import {
  ChangeDetectionStrategy, Component, OnInit, signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { tooltips } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  catchError, combineLatest, distinctUntilChanged, filter, map, of,
  startWith,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';

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
  protected nextUid = this.userFormStore.nextUid;
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

  get isNewUser(): boolean {
    return !this.editingUser();
  }

  constructor(
    private formBuilder: NonNullableFormBuilder,
    public slideInRef: SlideInRef<User | undefined, User>,
    private userFormStore: UserFormStore,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.setupUsernameUpdate();
    this.listenForAllFormsValidity();
    this.userFormStore.isNewUser.set(this.isNewUser);

    // TODO: Handle changes for `sshpubkey_file` input to set values on sshpubkey
    // TODO: Handle changes on `home` input to set the value of `home_mode` input
    // TODO: Handle changes on `home_create` field to set the value for `home_mode` field
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
    // if `user.immutable` is true for the user being edited
    // disable `group`, `home_mode`, `home`, `home_create` and `username`
    // if `user.builtin` is true, disable `smb`
    // set names already in user validator for `username`

    // TODO: if creating a new user,
    // set names already in user validator for `username`
    // set home share path by calling `sharing.smb.query`

    // TODO: set tooltips for sections

    // TODO: Add create home options warnings

    // TODO: Add controls for sudo related values

    if (this.editingUser()) {
      const {
        uid, username, email, full_name: fullName, smb, shell, home,
      } = this.editingUser();

      this.userFormStore.updateUserConfig({
        username,
        email,
        full_name: fullName,
        smb,
        shell,
        home,
        uid,
      });
      this.form.patchValue({
        username,
      });
    }
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

  protected onSubmit(): void {
    // TODO: password related fields are impacted if
    // UserStigPasswordOption.OneTimePassword is used as value for `stig_password`

    // TODO: If updating an existing user, and home properties are set,
    // two update calls should be made. First one to set `home_create:true` with the `home` value
    // second one that removes the `home` and `home_create` values from the payload and updates the rest of the user

    // TODO: Add option to download ssh public key entered with a button next to the save button

    this.isFormLoading.set(true);
    this.userFormStore.createUser().pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(undefined);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (user) => {
        this.isFormLoading.set(false);
        if (user) {
          this.slideInRef.close({ error: undefined, response: user });
        }
      },
    });

    // TODO: Add function to generate one time password from middleware using `auth.generate_onetime_password`
    // after the user create request is submitted
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
      map((status) => status !== 'VALID'),
    ));

    combineLatest(statusObservables).pipe(
      map((invalidArray) => invalidArray.some(Boolean)),
      untilDestroyed(this),
    ).subscribe((isInvalid) => this.isFormInvalid.set(isInvalid));
  }
}
