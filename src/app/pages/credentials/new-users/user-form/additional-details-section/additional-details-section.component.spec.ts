import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { User } from 'app/interfaces/user.interface';
import { DetailsItemHarness } from 'app/modules/details-table/details-item/details-item.harness';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AdditionalDetailsSectionComponent', () => {
  let spectator: Spectator<AdditionalDetailsSectionComponent>;
  let loader: HarnessLoader;

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

  const createComponent = createComponentFactory({
    component: AdditionalDetailsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(FilesystemService),
      mockProvider(UserFormStore, {
        isStigMode: jest.fn(() => false),
        nextUid: jest.fn(() => 1001),
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(() => 'prompt'),
        isNewUser: jest.fn(() => false),
        shellAccess: jest.fn(() => false),
        homeModeOldValue: jest.fn(() => ''),
      }),
      mockApi([
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('group.query', []),
        mockCall('sharing.smb.query', []),
        mockCall('filesystem.stat', {
          mode: 16889,
        } as FileSystemStat),
      ]),
    ],
  });

  describe('when creating a new user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks initial value when creating a new user', () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        full_name: '',
        email: null,
        group_create: true,
        groups: [],
        home: '',
        home_mode: '700',
        home_create: false,
        uid: null,
      });
      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('fill editables with custom value', async () => {
      const values = {
        'Full Name': 'Editable field',
        Email: 'editable@truenas.local',
        Groups: 'Not Set',
        Shell: 'bash',
        UID: 1234,
      };

      await (await loader.getHarness(DetailsTableHarness)).setValues(values);

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenLastCalledWith({
        full_name: 'Editable field',
        email: 'editable@truenas.local',
        group_create: true,
        groups: [],
        home: '',
        home_mode: '700',
        home_create: false,
        uid: '1234',
      });
    });
  });

  describe('when editing a user', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          editingUser: mockUser,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks initial value when editing user', async () => {
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(values).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Not Set',
        'Home Directory': '/home/test',
        Shell: '/usr/bin/bash',
        UID: 'Next Available',
      });

      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('loads home share path and puts it in home field', async () => {
      const homeInput = await loader.getHarness(DetailsItemHarness.with({ label: 'Home Directory' }));
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.query', [[['enabled', '=', true], ['home', '=', true]]]);
      expect(await homeInput.getValueText()).toBe('/home/test');
    });
  });

  // TODO: Add more tests
});
