import {
  FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { User } from '@sentry/angular';
import { MockComponents, MockInstance } from 'ng-mocks';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { UserFormComponent } from 'app/pages/credentials/new-users/user-form/user-form.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('UserFormComponent', () => {
  const mockUser = {
    id: 69,
    uid: 1004,
    username: 'test',
    home: '/home/test',
    shell: '/usr/bin/bash',
    full_name: 'test',
    builtin: false,
    smb: true,
    ssh_password_enabled: true,
    password_disabled: false,
    locked: false,
    sudo_commands_nopasswd: ['rm -rf /'],
    sudo_commands: [allCommands],
    email: null,
    sshpubkey: null,
    group: {
      id: 101,
    },
    groups: [101],
    immutable: false,
  } as User;

  let spectator: Spectator<UserFormComponent>;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const allowedAccessForm = new FormGroup({
    smb_access: new FormControl(true),
    truenas_access: new FormControl(false),
    ssh_access: new FormControl(false),
    shell_access: new FormControl(false),
    role: new FormControl('prompt'),
  });

  const authForm = new FormGroup({
    password: new FormControl(),
    password_conf: new FormControl(),
    password_disabled: new FormControl(false),
    allow_ssh_login_with_password: new FormControl(false),
    ssh_key: new FormControl(''),
    stig_password: new FormControl(''),
    show_password: new FormControl(false),
  });

  const additionalDetailsForm = new FormGroup({
    username: new FormControl(''),
    full_name: new FormControl(''),
    email: new FormControl(''),
    group: new FormControl(101),
    groups: new FormControl([101]),
    home: new FormControl('/home/test'),
    shell: new FormControl('/usr/bin/bash'),
  });

  MockInstance(AllowedAccessSectionComponent, () => ({
    form: allowedAccessForm as unknown as AllowedAccessSectionComponent['form'],
  }));

  MockInstance(AuthSectionComponent, () => ({
    form: authForm as unknown as AuthSectionComponent['form'],
  }));

  MockInstance(AdditionalDetailsSectionComponent, () => ({
    form: additionalDetailsForm as unknown as AdditionalDetailsSectionComponent['form'],
  }));

  const createComponent = createComponentFactory({
    component: UserFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponents(
        AuthSectionComponent,
        AdditionalDetailsSectionComponent,
        AllowedAccessSectionComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('group.query', [{
          id: 101,
          group: 'test-group',
        }, {
          id: 102,
          group: 'mock-group',
        }] as Group[]),
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
      ]),
      mockProvider(UserFormStore, {
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        createUser: jest.fn(),
        isNewUser: jest.fn(),
      }),
      mockProvider(ErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  describe('adding user', () => {
    beforeEach(() => {
      spectator = createComponent();
    });

    it('checks initial value', () => {
      expect(spectator.component.isNewUser).toBe(true);
    });
  });

  describe('editing user', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
        ],
      });
    });

    it('checks initial value', () => {
      expect(spectator.component.isNewUser).toBe(false);
    });
  });

  // TODO: Add more tests
});
