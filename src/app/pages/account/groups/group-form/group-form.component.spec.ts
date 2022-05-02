import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Group } from 'app/interfaces/group.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('GroupFormComponent', () => {
  let spectator: Spectator<GroupFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
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
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('adding a group', () => {
    beforeEach(() => {
      spectator.component.setupForm();
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
        'Permit Sudo': true,
        'Samba Authentication': true,
        'Allow Duplicate GIDs': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        sudo: true,
        smb: true,
        allow_duplicate_gid: true,
      }]);
    });
  });

  describe('editing a group', () => {
    beforeEach(() => {
      spectator.component.setupForm({
        id: 13,
        gid: 1111,
        group: 'editing',
        sudo: true,
        smb: false,
      } as Group);
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
        'Permit Sudo': true,
        'Samba Authentication': false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated',
        'Permit Sudo': false,
        'Samba Authentication': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('group.update', [
        13,
        {
          name: 'updated',
          sudo: false,
          smb: true,
          allow_duplicate_gid: true,
        },
      ]);
    });
  });
});
