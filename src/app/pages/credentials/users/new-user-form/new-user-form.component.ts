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
import { User } from 'app/interfaces/user.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/new-user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/new-user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/new-user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/users/new-user-form/new-user.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  protected editingUser = signal(undefined);

  protected isFormLoading = signal<boolean>(false);

  get isNewUser(): boolean {
    return !this.editingUser;
  }

  protected form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
  });

  protected readonly fakeTooltip = '';

  constructor(
    private formBuilder: NonNullableFormBuilder,
    public slideInRef: SlideInRef<User | undefined, boolean>,
    private userFormStore: UserFormStore,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    this.setupUsernameUpdate();
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

    // TODO: Add `stig_password` field for "stig password" field which is heavily impacted by `isStigMode`
    // Use `isStigMode` to determine smb related controls disable status and values
    // `isStigMode` also affects `password` and `password_conf` fields to be disabled
    // `isStigMode` also affects `locked` to be disabled while
    // `stig_password` value is `UserStigPasswordOption.DisablePassword`

    // TODO: set tooltips for sections

    // TODO: Add create home options warnings

    // TODO: Add controls for sudo related values

    this.editingUser.set(this.slideInRef.getData() as User);
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
          this.slideInRef.close({ error: undefined, response: true });
        }
      },
    });

    // TODO: Add function to generate one time password from middleware using `auth.generate_onetime_password`
    // after the user create request is submitted
  }

  protected readonly tooltips = tooltips;
  protected readonly Role = Role;
}
