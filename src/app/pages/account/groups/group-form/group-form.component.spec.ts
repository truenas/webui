import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('GroupFormComponent', () => {
  let spectator: Spectator<GroupFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const fakeDataGroup = {
    id: 13,
    gid: 1111,
    group: 'editing',
    sudo_commands: [],
    sudo_commands_nopasswd: [allCommands],
    smb: false,
  } as Group;

  const createComponent = createComponentFactory({
    component: GroupFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('group.query', [{ group: 'existing' }] as Group[]),
        mockCall('group.create'),
        mockCall('group.update'),
        mockCall('group.get_next_gid', 1234),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(FormErrorHandlerService),
      provideMockStore(),
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
        'Samba Authentication': true,
        'Allow all sudo commands': true,
        'Allowed sudo commands with no password': ['ls'],
        'Allow Duplicate GIDs': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        smb: true,
        allow_duplicate_gid: true,
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
        'Samba Authentication': false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated',
        'Samba Authentication': true,
        'Allow all sudo commands with no password': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.update', [
        13,
        {
          name: 'updated',
          smb: true,
          allow_duplicate_gid: true,
          sudo_commands: [],
          sudo_commands_nopasswd: [],
        },
      ]);
    });
  });
});
