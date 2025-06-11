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
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
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
        userConfig: jest.fn(() => ({})),
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
        shell: '/usr/bin/bash',
        group_create: true,
        groups: [],
        home: '',
        home_mode: '700',
        home_create: false,
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        uid: null,
      });
      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('fill editables with custom value', async () => {
      await (await loader.getHarness(DetailsTableHarness)).setValues({
        'Full Name': 'Editable field',
        Email: 'editable@truenas.local',
        Groups: 'Not Set',
        Shell: 'bash',
        UID: 1234,
      });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenLastCalledWith({
        full_name: 'Editable field',
        email: 'editable@truenas.local',
        shell: '/usr/bin/bash',
        sudo_commands: [],
        sudo_commands_nopasswd: [],
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
        // TODO: Investigate why UID is 'Next Available' instead of 1004
        UID: '{uid}',
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

    it('check uid field is disabled', async () => {
      const editables = await loader.getHarness(DetailsTableHarness);

      expect(await editables.getValues()).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Not Set',
        'Home Directory': '/home/test',
        Shell: '/usr/bin/bash',
        UID: 'Next Available',
      });

      const uidField = await editables.getHarnessForItem('UID', EditableHarness);
      await uidField.open();

      spectator.detectChanges();

      const uidInput = await loader.getHarness(IxInputHarness.with({ selector: '[aria-label="UID"]' }));
      expect(await uidInput.isDisabled()).toBeTruthy();
    });
  });

  // TODO: Add more tests
});
