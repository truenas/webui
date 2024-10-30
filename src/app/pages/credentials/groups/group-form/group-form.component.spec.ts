import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('GroupFormComponent', () => {
  let spectator: Spectator<GroupFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const fakePrivilegeDataSource: Privilege[] = [
    {
      id: 1,
      name: 'Privilege 1',
      web_shell: true,
      local_groups: [{ gid: 1111, group: 'Group A' }, { gid: 2222, group: 'Group B' }],
      ds_groups: [{ gid: 1223 }],
      roles: [Role.SharingAdmin],
    },
    {
      id: 2,
      name: 'Privilege 2',
      web_shell: false,
      local_groups: [],
      ds_groups: [],
      roles: [Role.FullAdmin, Role.ReadonlyAdmin],
    },
  ] as Privilege[];

  const fakeDataGroup = {
    id: 13,
    gid: 1111,
    sudo_commands: [],
    name: 'Group A',
    sudo_commands_nopasswd: [allCommands],
    smb: false,
    group: 'editing',
  } as Group;

  const createComponent = createComponentFactory({
    component: GroupFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('group.query', [{ group: 'existing', gid: 1111 }] as Group[]),
        mockCall('privilege.query', fakePrivilegeDataSource),
        mockCall('group.create', 1111),
        mockCall('group.update', 1111),
        mockCall('privilege.update'),
        mockCall('group.get_next_gid', 1234),
      ]),
      mockProvider(SlideInRef),
      mockProvider(FormErrorHandlerService),
      provideMockStore(),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a group', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('loads names of existing groups and makes sure new name is unique', async () => {
      const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameInput.setValue('existing');

      expect(ws.call).toHaveBeenCalledWith('group.query');
      expect(await nameInput.getErrorText()).toBe('The name "existing" is already in use.');
    });

    it('loads next gid and puts it in gid field', async () => {
      const gidInput = await loader.getHarness(IxInputHarness.with({ label: 'GID' }));
      const value = await gidInput.getValue();

      expect(ws.call).toHaveBeenCalledWith('group.get_next_gid');
      expect(value).toBe('1234');
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new',
        'SMB Group': true,
        'Allow all sudo commands': true,
        'Allowed sudo commands with no password': ['ls'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
    });
  });

  describe('editing a group', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: fakeDataGroup },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('does not show Allow Duplicate Gid on edit', async () => {
      const input = await loader.getAllHarnesses(IxInputHarness.with({ label: 'Allow Duplicate Gid' }));
      expect(input).toHaveLength(0);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        GID: '1111',
        Name: 'editing',
        'Allow all sudo commands': false,
        'Allowed sudo commands': [],
        'Allow all sudo commands with no password': true,
        'Allowed sudo commands with no password': [],
        'SMB Group': false,
        Privileges: ['Privilege 1'],
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated',
        'SMB Group': true,
        'Allow all sudo commands with no password': false,
        Privileges: ['Privilege 1'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.update', [
        13,
        {
          name: 'updated',
          smb: true,
          sudo_commands: [],
          sudo_commands_nopasswd: [],
        },
      ]);

      expect(ws.call).toHaveBeenCalledWith('privilege.update', [1, {
        ds_groups: [1223], local_groups: [2222], name: 'Privilege 1', roles: ['SHARING_ADMIN'], web_shell: true,
      }]);
    });

    it('updates privilege items when removed privilege from the group', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated',
        'SMB Group': true,
        'Allow all sudo commands with no password': false,
        Privileges: ['Privilege 2'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('privilege.update', [1, {
        ds_groups: [1223], local_groups: [2222], name: 'Privilege 1', roles: ['SHARING_ADMIN'], web_shell: true,
      }]);
    });
  });
});
