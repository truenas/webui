import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
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

  const shellAccess = signal(false);
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
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(() => null),
        isNewUser: jest.fn(() => false),
        homeModeOldValue: jest.fn(() => ''),
        userConfig: jest.fn(() => ({})),
        shellAccess: jest.fn(() => shellAccess()),
        state$: of({
          setupDetails: {
            allowedAccess: {
              shellAccess: shellAccess(),
            },
          },
        }),
      }),
      mockApi([
        mockCall('user.shell_choices', {
          '/usr/sbin/nologin': 'nologin',
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('group.query', [{
          id: 101,
          group: 'test-group',
        }] as Group[]),
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
      shellAccess.set(false);
    });

    it('checks initial value when creating a new user', () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        full_name: '',
        email: null,
        shell: '/usr/sbin/nologin',
        group_create: true,
        groups: [],
        group: null,
        home: '/var/empty',
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
        Groups: 'test-group',
        UID: 1234,
      });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenLastCalledWith({
        full_name: 'Editable field',
        email: 'editable@truenas.local',
        shell: '/usr/sbin/nologin',
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        group_create: true,
        group: null,
        groups: [],
        home: '/var/empty',
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
      shellAccess.set(false);
    });

    it('checks initial value when editing user', async () => {
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(values).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Primary Group: test-group  Auxiliary Groups: test-group',
        'Home Directory': '/home/test',
        UID: '1004',
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
        Groups: 'Primary Group: test-group  Auxiliary Groups: test-group',
        'Home Directory': '/home/test',
        UID: '1004',
      });

      const uidField = await editables.getHarnessForItem('UID', EditableHarness);
      await uidField.open();

      spectator.detectChanges();

      const uidInput = await loader.getHarness(IxInputHarness.with({ selector: '[aria-label="UID"]' }));
      expect(await uidInput.isDisabled()).toBeTruthy();
    });

    it('checks bash shell is selected when shell access is enabled', async () => {
      shellAccess.set(true);
      spectator.detectChanges();

      const editables = await loader.getHarness(DetailsTableHarness);
      expect(await editables.getValues()).toEqual(expect.objectContaining({
        Shell: '/usr/bin/bash',
      }));
    });
  });

  // TODO: Add more tests
});
