import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { Group } from 'app/interfaces/group.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { selectUsers } from 'app/pages/credentials/users/store/user.selectors';
import { DownloadService } from 'app/services/download.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { StorageService } from 'app/services/storage.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  const mockGroups = [{
    id: 101,
    group: 'test-group',
  }, {
    id: 102,
    group: 'mock-group',
  }] as Group[];

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
  const builtinUser = { ...mockUser, builtin: true, immutable: true };
  let spectator: Spectator<UserFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: UserFormComponent,
    imports: [
      ReactiveFormsModule,
      IxPermissionsComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('user.query'),
        mockCall('user.create'),
        mockCall('user.update'),
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('user.get_next_uid', 1234),
        mockCall('group.query', mockGroups),
        mockCall('sharing.smb.query', [{ path: '/mnt/users' }] as SmbShare[]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef),
      mockProvider(StorageService, {
        filesystemStat: jest.fn(() => of({ mode: 16832 })),
      }),
      mockProvider(DownloadService, {
        downloadBlob: jest.fn(),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of(mockGroups)),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      provideMockStore({
        selectors: [{
          selector: selectUsers,
          value: [mockUser],
        }],
      }),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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
      expect(await homeInput.getValue()).toBe('/mnt/users');
    });

    it('checks download ssh key button is hidden', async () => {
      const downloadButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Download Authorized Keys' }));
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

    it('set disable password is true and check inputs', async () => {
      const form = await loader.getHarness(IxFormHarness);
      form.fillForm({
        'Disable Password': true,
      });

      const disabled = await form.getDisabledState();
      expect(disabled).toEqual(expect.objectContaining({
        'Confirm Password': true,
        'Lock User': true,
        Password: true,
      }));
    });
  });

  describe('editing a user', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: mockUser },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
      spectator.component.setupForm();
    });

    it('check uid field is disabled', async () => {
      const uidInput = await loader.getHarness(IxInputHarness.with({ label: 'UID' }));
      expect(await uidInput.isDisabled()).toBeTruthy();
    });

    it('check change password', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'New Password': 'changepwd',
        'Confirm New Password': 'changepwd',
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
        'Authorized Keys': 'test-key',
        Username: 'test-user',
      });

      const downloadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Authorized Keys' }));
      await downloadButton.click();

      expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(new Blob(), 'test-user_public_key_rsa');
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Auxiliary Groups': ['test-group'],
        'SSH password login enabled': true,
        'Confirm New Password': '',
        'Create New Primary Group': false,
        'Disable Password': false,
        'Full Name': 'test',
        'Home Directory Permissions': '700',
        'Home Directory': '/home/test',
        'Lock User': false,
        'Primary Group': 'test-group',
        'SMB User': true,
        'Authorized Keys': '',
        'Upload SSH Key': [],
        'Create Home Directory': false,
        UID: '1004',
        Email: '',
        'New Password': '',
        Shell: 'bash',
        Username: 'test',
        'Allowed sudo commands': [],
        'Allow all sudo commands': true,
        'Allowed sudo commands with no password': ['rm -rf /'],
        'Allow all sudo commands with no password': false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm(
        {
          'Auxiliary Groups': ['mock-group', 'test-group'],
          'Full Name': 'updated',
          'Home Directory': '/home/updated',
          'Primary Group': 'mock-group',
          'Create Home Directory': true,
          'SMB User': false,
          'Lock User': true,
          Shell: 'zsh',
          Username: 'updated',
          'Allow all sudo commands': false,
          'Allowed sudo commands': ['pwd'],
          'Allowed sudo commands with no password': [],
          'Allow all sudo commands with no password': true,
          'Home Directory Permissions': '755',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('user.update', [
        69, { home: '/home/updated', home_create: true },
      ]);

      expect(ws.call).toHaveBeenLastCalledWith('user.update', [
        69,
        {
          email: null,
          full_name: 'updated',
          group: 102,
          groups: [102, 101],
          home_mode: '755',
          locked: true,
          password_disabled: false,
          shell: '/usr/bin/zsh',
          smb: false,
          ssh_password_enabled: true,
          sshpubkey: null,
          sudo_commands: ['pwd'],
          sudo_commands_nopasswd: [allCommands],
          username: 'updated',
        },
      ]);
    });
  });

  describe('checks form states', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: builtinUser },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
      spectator.component.setupForm();
    });

    it('check form inputs when user is builtin', async () => {
      spectator.component.setupForm();

      const form = await loader.getHarness(IxFormHarness);
      const disabled = await form.getDisabledState();

      expect(disabled).toEqual(expect.objectContaining({
        'Home Directory': true,
        'Primary Group': true,
        Username: true,
        'SMB User': true,
      }));
    });
  });
});
