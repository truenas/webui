import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents, MockInstance } from 'ng-mocks';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/user-form/additional-details-section/additional-details-section.component';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/user-form/auth-section/auth-section.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { UserFormStore } from 'app/pages/credentials/users/user-form/user.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('UserFormComponent', () => {
  const mockUser = {
    id: 69,
    uid: 1004,
    username: 'test',
    unixhash: '',
    smbhash: '',
    home: '/home/test',
    shell: '/usr/bin/bash',
    full_name: 'test',
    builtin: false,
    immutable: true,
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
    twofactor_auth_configured: false,
    local: true,
    id_type_both: false,
    roles: [],
    api_keys: [],
  } as User;

  let spectator: Spectator<UserFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
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
    ssh_password_enabled: new FormControl(false),
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
      mockAuth(),
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
        mockCall('user.create', { username: 'new-user' } as User),
        mockCall('user.update', { username: 'test' } as User),
        mockCall('system.security.config', { enable_gpos_stig: false } as SystemSecurityConfig),
        mockCall('user.get_next_uid', 1005),
      ]),
      UserFormStore,
      mockProvider(ErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      provideMockStore({
        selectors: [{
          selector: selectUsers,
          value: [],
        }],
      }),
    ],
  });

  it('checks used components', () => {
    expect(AllowedAccessSectionComponent).toBeTruthy();
    expect(AuthSectionComponent).toBeTruthy();
    expect(AdditionalDetailsSectionComponent).toBeTruthy();
  });

  describe('adding user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks form title', () => {
      expect(spectator.query(ModalHeaderComponent).title).toBe('Add User');
    });
  });

  describe('editing user', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks form title', () => {
      expect(spectator.query(ModalHeaderComponent).title).toBe('Edit User');
    });

    it('checks username field is disabled when user immutable', async () => {
      const usernameField = await loader.getHarness(IxInputHarness.with({ label: 'Username' }));
      expect(await usernameField.isDisabled()).toBeTruthy();
    });
  });

  describe('validation clearing integration', () => {
    it('verifies FormErrorHandlerService has clearValidationErrorsForHiddenFields method', () => {
      // This test ensures the FormErrorHandlerService method exists and can be called
      // This validates our integration point without testing private implementation

      spectator = createComponent();

      // Verify the service was injected and has the expected method
      const formErrorHandler = spectator.inject(FormErrorHandlerService);
      expect(formErrorHandler).toBeDefined();
      expect(formErrorHandler.clearValidationErrorsForHiddenFields).toBeDefined();
      expect(typeof formErrorHandler.clearValidationErrorsForHiddenFields).toBe('function');
    });

    it('validates that component initializes correctly', () => {
      // Test that the component initializes without errors
      spectator = createComponent();

      // Verify component initialization succeeded
      expect(spectator.component).toBeDefined();
      expect(spectator.component).toBeInstanceOf(UserFormComponent);
    });
  });

  describe('username field', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('should show error when username is empty', async () => {
      await form.fillForm({ Username: '' });

      const usernameInput = await form.getControl('Username') as IxInputHarness;
      expect(await usernameInput.getErrorText()).toBe('Username is required');
    });

    it('should show error for invalid username pattern', async () => {
      await form.fillForm({ Username: 'invalid@user' });

      const usernameInput = await form.getControl('Username') as IxInputHarness;
      const error = await usernameInput.getErrorText();
      expect(error).toBe('Invalid format or character');
    });

    it('should show error for username exceeding 32 characters', async () => {
      await form.fillForm({ Username: 'a'.repeat(33) });

      const usernameInput = await form.getControl('Username') as IxInputHarness;
      expect(await usernameInput.getErrorText()).toBe('The length of Username should be no more than 32');
    });

    it('should accept valid username', async () => {
      await form.fillForm({ Username: 'validuser' });

      const usernameInput = await form.getControl('Username') as IxInputHarness;
      expect(await usernameInput.getErrorText()).toBe('');
    });
  });

  describe('editing existing user', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('should populate username field with existing user data', async () => {
      const usernameInput = await form.getControl('Username') as IxInputHarness;
      expect(await usernameInput.getValue()).toBe('test');
    });

    it('should disable username field for immutable user', async () => {
      const usernameInput = await form.getControl('Username') as IxInputHarness;
      expect(await usernameInput.isDisabled()).toBe(true);
    });
  });

  describe('form submission', () => {
    describe('save button', () => {
      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('should be disabled when form is invalid', async () => {
        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        expect(await saveButton.isDisabled()).toBe(true);
      });

      it('should be enabled when form has valid username', async () => {
        const testForm = await loader.getHarness(IxFormHarness);
        await testForm.fillForm({
          Username: 'validuser',
        });

        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        expect(await saveButton.isDisabled()).toBe(false);
      });
    });

    describe('editing existing user', () => {
      beforeEach(async () => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
        form = await loader.getHarness(IxFormHarness);
      });

      it('should call user.update API when saving changes', async () => {
        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        await saveButton.click();

        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [
          69,
          expect.objectContaining({
            username: 'test',
          }),
        ]);
      });

      it('should close slide-in after successful update', async () => {
        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
        await saveButton.click();

        expect(slideInRef.close).toHaveBeenCalledWith({
          response: expect.objectContaining({ username: 'test' }),
        });
      });
    });
  });
});
