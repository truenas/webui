import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { tooltips } from '@codemirror/view';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
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
import { AdditionalDetailsConfig } from 'app/pages/credentials/users/new-user-form/interfaces/additional-details-config.interface';
import { AllowAccessConfig } from 'app/pages/credentials/users/new-user-form/interfaces/allow-access-config.interface';
import { UserAuthConfig } from 'app/pages/credentials/users/new-user-form/interfaces/user-auth-config.interface';
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
})
export class NewUserFormComponent {
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
  ) { }

  protected onSubmit(): void {}

  protected readonly tooltips = tooltips;
  protected readonly Role = Role;
}
