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
  TnFormFieldComponent, TnFormFieldHarness, TnInputComponent, TnInputHarness,
} from '@truenas/ui-components';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
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
      provideTnFormFieldErrors(),
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

  describe('editing user', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { editUser: mockUser } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks username field is disabled when user immutable', async () => {
      const usernameField = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
      expect(await usernameField.isDisabled()).toBeTruthy();
    });
  });

  describe('side panel host', () => {
    // The form is hosted exclusively in a <tn-side-panel> (FormSidePanelService), which owns the
    // header + footer Save; the form delegates submission through canSubmit()/submit().
    beforeEach(() => {
      spectator = createComponent();
    });

    it('does not render an in-form header (the panel host renders its own)', () => {
      expect(spectator.query(ModalHeaderComponent)).toBeNull();
    });

    it('does not render an in-form Save action (the panel footer owns it)', () => {
      expect(spectator.query('ix-form-actions')).toBeNull();
    });

    it('exposes submit() and canSubmit for the panel footer to drive', () => {
      expect(typeof spectator.component.submit).toBe('function');
      expect(spectator.component.canSubmit()).toBe(false);
    });

    it('exposes isBusy so the panel host can show its loader while submitting', () => {
      // Public contract only: not busy until a submit is in flight. The loading source is
      // internal here (this form overrides isBusy to read its own isFormLoading rather than the
      // base trackCanSubmit signal), and the busy-during-submit wiring is covered by the
      // SidePanelForm directive spec, so we don't reach into protected state to force it true.
      expect(typeof spectator.component.isBusy).toBe('function');
      expect(spectator.component.isBusy()).toBe(false);
    });

    it('exposes isSubmitting so the panel host only shows "Saving…" during an actual save', () => {
      // Public contract only: false outside a save (no submit in flight). This form overrides
      // isSubmitting to track its own isFormLoading (which is set only by the submit path, including
      // the async confirmation-dialog route); the submit-in-flight transition is covered by the
      // "shows Saving… even when the save is gated behind an async confirmation" test below.
      expect(spectator.component.isSubmitting()).toBe(false);
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
        const input = spectator.query<HTMLInputElement>('input[name="username"]');
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
      expect(await usernameField.getErrorMessage()).toBe('Field is required');
    });

    it('should show error for invalid username pattern', async () => {
      const usernameField = await setUsername('invalid@user');
      expect(await usernameField.getErrorMessage()).toBe('Invalid format or character');
    });

    it('should show error for username exceeding 32 characters', async () => {
      const usernameField = await setUsername('a'.repeat(33));
      expect(await usernameField.getErrorMessage()).toBe('The length of the field should be no more than 32');
    });

    it('should accept valid username', async () => {
      const usernameField = await setUsername('validuser');
      expect(await usernameField.getErrorMessage()).toBeNull();
    });
  });

  describe('editing existing user', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { editUser: mockUser } });
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
    // The form renders no in-form Save button; the `<tn-side-panel>` footer gates on `canSubmit`
    // and calls the public `submit()`. Drive that surface directly.
    describe('submission gating (canSubmit)', () => {
      beforeEach(() => {
        spectator = createComponent();
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('cannot submit when form is invalid', () => {
        expect(spectator.component.canSubmit()).toBe(false);
      });

      it('can submit when form has valid username', async () => {
        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('validuser');

        expect(spectator.component.canSubmit()).toBe(true);
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

        spectator.component.submit();

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [
          expect.objectContaining({
            username: 'newuser',
          }),
        ]);
      });

      it('shows "Saving…" via isSubmitting even when the save is gated behind an async confirmation', async () => {
        // The default new-user values trigger getHomeCreateWarning, so onSubmit() routes through the
        // (asynchronous) confirmation dialog before the save goes busy. Hold both the confirm and the
        // create in flight so we can observe each phase.
        const confirm$ = new Subject<boolean>();
        // mockReturnValueOnce so the shared confirm mock reverts to its default for later tests.
        (spectator.inject(DialogService).confirm as jest.Mock).mockReturnValueOnce(confirm$);
        const create$ = new Subject<User>();
        // UserFormStore is provided at the component level, so spy the component-injector instance.
        const store = spectator.fixture.debugElement.injector.get(UserFormStore);
        jest.spyOn(store, 'createUser').mockReturnValue(create$);

        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('newuser');
        spectator.detectChanges();
        await spectator.fixture.whenStable();

        spectator.component.submit();
        spectator.detectChanges();

        // Awaiting the user's confirmation: the save hasn't started, so it must not read "Saving…".
        expect(spectator.component.isSubmitting()).toBe(false);

        // User confirms → loading flips true (long after submit() returned) → Save must show "Saving…".
        confirm$.next(true);
        spectator.detectChanges();
        expect(spectator.component.isBusy()).toBe(true);
        expect(spectator.component.isSubmitting()).toBe(true);

        // Save settles → no longer "Saving…".
        create$.next({ username: 'newuser' } as User);
        create$.complete();
        spectator.detectChanges();
        expect(spectator.component.isSubmitting()).toBe(false);
      });

      it('emits the created user through the closed output after successful creation', async () => {
        const emitSpy = jest.spyOn(spectator.component.closed, 'emit');
        const usernameInput = await loader.getHarness(TnInputHarness.with({ name: 'username' }));
        await usernameInput.setValue('newuser');

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        spectator.component.submit();

        spectator.detectChanges();
        await spectator.fixture.whenStable();

        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ username: 'new-user' }));
      });
    });

    describe('editing existing user', () => {
      beforeEach(() => {
        spectator = createComponent({ props: { editUser: mockUser } });
        loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      });

      it('should call user.update API when saving changes', () => {
        spectator.component.submit();

        expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [
          69,
          expect.objectContaining({
            username: 'test',
          }),
        ]);
      });

      it('emits the updated user through the closed output after successful update', () => {
        const emitSpy = jest.spyOn(spectator.component.closed, 'emit');

        spectator.component.submit();

        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ username: 'test' }));
      });
    });
  });
});
