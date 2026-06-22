// cspell:ignore newuser validuser
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import {
  FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonHarness, TnFormFieldComponent, TnFormFieldHarness, TnInputComponent, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    homeEditable: signal(undefined),
  } as Partial<AdditionalDetailsSectionComponent>));

  const createComponent = createComponentFactory({
    component: UserFormComponent,
    imports: [
      ReactiveFormsModule,
      TranslateModule.forRoot(),
      TnFormFieldComponent,
      TnInputComponent,
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
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
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
      const usernameField = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
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
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    async function setUsername(value: string): Promise<TnFormFieldHarness> {
      const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
      if (value === '') {
        // The harness can't type an empty string; type a value then clear the native
        // input to leave the field dirty and empty so the required error surfaces.
        await usernameInput.setValue('a');
        const input = spectator.query<HTMLInputElement>('input');
        input.value = '';
        spectator.dispatchFakeEvent(input, 'input');
        spectator.dispatchFakeEvent(input, 'blur');
        spectator.detectChanges();
      } else {
        await usernameInput.setValue(value);
      }
      return loader.getHarness(TnFormFieldHarness.with({ label: 'Username' }));
    }

    it('should show error when username is empty', async () => {
      const usernameField = await setUsername('');
      expect(await usernameField.getErrorMessage()).toBe('This field is required');
    });

    it('should show error for invalid username pattern', async () => {
      const usernameField = await setUsername('invalid@user');
      expect(await usernameField.getErrorMessage()).toBe('Please enter a valid format');
    });

    it('should show error for username exceeding 32 characters', async () => {
      const usernameField = await setUsername('a'.repeat(33));
      expect(await usernameField.getErrorMessage()).toBe('Maximum length is 32');
    });

    it('should accept valid username', async () => {
      const usernameField = await setUsername('validuser');
      expect(await usernameField.getErrorMessage()).toBeNull();
    });
  });

  describe('editing existing user', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should populate username field with existing user data', async () => {
      const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
      expect(await usernameInput.getValue()).toBe('test');
    });

    it('should disable username field for immutable user', async () => {
      const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
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
        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        expect(await saveButton.isDisabled()).toBe(true);
      });

      it('should be enabled when form has valid username', async () => {
        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('validuser');

        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        expect(await saveButton.isDisabled()).toBe(false);
      });
    });

    describe('creating new user', () => {
      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('should call user.create API when saving new user', async () => {
        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('newuser');

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        await saveButton.click();

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [
          expect.objectContaining({
            username: 'newuser',
          }),
        ]);
      });

      it('should close slide-in after successful creation', async () => {
        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('newuser');

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        await saveButton.click();

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        expect(slideInRef.close).toHaveBeenCalledWith({
          response: expect.objectContaining({ username: 'new-user' }),
        });
      });
    });

    describe('editing existing user', () => {
      beforeEach(() => {
        spectator = createComponent({
          providers: [
            mockProvider(SlideInRef, { ...slideInRef, getData: () => mockUser }),
          ],
        });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('should call user.update API when saving changes', async () => {
        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        await saveButton.click();

        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [
          69,
          expect.objectContaining({
            username: 'test',
          }),
        ]);
      });

      it('should close slide-in after successful update', async () => {
        const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
        await saveButton.click();

        expect(slideInRef.close).toHaveBeenCalledWith({
          response: expect.objectContaining({ username: 'test' }),
        });
      });
    });
  });
});
