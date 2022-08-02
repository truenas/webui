import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { User } from 'app/interfaces/user.interface';
import { IxExplorerHarness } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { selectUsers } from 'app/pages/account/users/store/user.selectors';
import { StorageService, UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { UserFormComponent } from './user-form.component';

const mockUser = {
  id: 69,
  uid: 1004,
  username: 'test',
  home: '/home/test',
  shell: '/usr/bin/bash',
  full_name: 'test',
  builtin: false,
  smb: true,
  password_disabled: false,
  locked: false,
  sudo: false,
  sudo_nopasswd: false,
  sudo_commands: [],
  email: null,
  sshpubkey: null,
  group: {
    id: 101,
  },
  groups: [101],
} as User;

describe('UserFormComponent', () => {
  let spectator: Spectator<UserFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: UserFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.query'),
        mockCall('user.create'),
        mockCall('user.update'),
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('user.get_next_uid', 1234),
        mockCall('group.query', [{
          id: 101,
          group: 'test-group',
        }, {
          id: 102,
          group: 'mock-group',
        }] as Group[]),
        mockCall('sharing.smb.query', [{ path: '/mnt/users' }] as SmbShare[]),
      ]),
      mockProvider(IxSlideInService, {
        onClose$: of(true),
      }),
      mockProvider(StorageService, {
        filesystemStat: jest.fn(() => of({ mode: 16832 })),
        downloadBlob: jest.fn(),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(UserService),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      provideMockStore({
        selectors: [{
          selector: selectUsers,
          value: [mockUser],
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('adding a user', () => {
    beforeEach(() => {
      spectator.component.setupForm();
    });

    it('loads next uid and puts it in uid field', async () => {
      const uidInput = await loader.getHarness(IxInputHarness.with({ label: 'UID' }));
      const value = await uidInput.getValue();

      expect(ws.call).toHaveBeenCalledWith('user.get_next_uid');
      expect(value).toBe('1234');
    });

    it('loads home share path and puts it in home field', async () => {
      const homeInput = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      expect(ws.call).toHaveBeenCalledWith('sharing.smb.query', [[['enabled', '=', true], ['home', '=', true]]]);
      expect(await homeInput.getValue()).toBe('/mnt/users');

      const usernameInput = await loader.getHarness(IxInputHarness.with({ label: 'Username' }));
      await usernameInput.setValue('test');
      expect(await homeInput.getValue()).toBe('/mnt/users/test');
    });

    it('checks download ssh key button is hidden', async () => {
      const downloadButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Download SSH Public Key' }));
      expect(downloadButtons).toHaveLength(0);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Full Name': 'John Smith',
        Password: 'test-pass',
        'Confirm Password': 'test-pass',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('user.create', [expect.objectContaining({
        full_name: 'John Smith',
        group_create: true,
        password: 'test-pass',
        uid: 1234,
        username: 'jsmith',
      })]);
    });
  });

  describe('editing a user', () => {
    beforeEach(() => {
      spectator.component.setupForm(mockUser);
    });

    it('check uid field is disabled', async () => {
      const uidInput = await loader.getHarness(IxInputHarness.with({ label: 'UID' }));
      expect(await uidInput.isDisabled()).toBeTruthy();
    });

    it('check change password', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Password: 'changepwd',
        'Confirm Password': 'changepwd',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('user.update', [69, expect.objectContaining({
        password: 'changepwd',
      })]);
    });

    it('shows download ssh key button', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'SSH Public Key': 'test-key',
        Username: 'test-user',
      });

      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download SSH Public Key' }));
      await downloadButton.click();

      expect(spectator.inject(StorageService).downloadBlob).toHaveBeenCalledWith(new Blob(), 'test-user_public_key_rsa');
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Auxiliary Groups': ['test-group'],
        'Confirm Password': '',
        'Create New Primary Group': false,
        'Disable Password': false,
        'Full Name': 'test',
        'Home Directory Permissions': '700',
        'Home Directory': '/home/test',
        'Lock User': false,
        'Permit Sudo': false,
        'Primary Group': 'test-group',
        'Samba Authentication': true,
        'SSH Public Key': '',
        UID: '1004',
        Email: '',
        Password: '',
        Shell: 'bash',
        Username: 'test',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Auxiliary Groups': ['mock-group'],
        'Full Name': 'updated',
        'Home Directory Permissions': '755',
        'Home Directory': '/home/updated',
        'Permit Sudo': true,
        'Primary Group': 'mock-group',
        'Samba Authentication': false,
        'Lock User': true,
        Shell: 'zsh',
        Username: 'updated',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('user.update', [
        69,
        {
          email: null,
          full_name: 'updated',
          group: 102,
          groups: [102],
          home_mode: '755',
          home: '/home/updated',
          locked: true,
          password_disabled: false,
          shell: '/usr/bin/zsh',
          smb: false,
          sshpubkey: null,
          sudo: true,
          username: 'updated',
        },
      ]);
    });
  });

  describe('checks form states', () => {
    it('set disable password is true and check inputs', async () => {
      spectator.component.setupForm();

      const form = await loader.getHarness(IxFormHarness);
      form.fillForm({
        'Disable Password': true,
      });

      const disabled = await form.getDisabledState();
      expect(disabled).toEqual(expect.objectContaining({
        'Confirm Password': true,
        'Lock User': true,
        'Permit Sudo': true,
        Password: true,
      }));
    });

    it('check form inputs when user is builtin', async () => {
      spectator.component.setupForm({ ...mockUser, builtin: true });

      const form = await loader.getHarness(IxFormHarness);
      const disabled = await form.getDisabledState();

      expect(disabled).toEqual(expect.objectContaining({
        'Home Directory Permissions': true,
        'Home Directory': true,
        'Primary Group': true,
        Username: true,
      }));
    });
  });
});
