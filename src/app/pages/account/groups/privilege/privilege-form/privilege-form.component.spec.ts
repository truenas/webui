import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeRole } from 'app/interfaces/privilege.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { PrivilegeFormComponent } from 'app/pages/account/groups/privilege/privilege-form/privilege-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('PrivilegeFormComponent', () => {
  let spectator: Spectator<PrivilegeFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const fakeDataPrivilege = {
    id: 10,
    name: 'privilege',
    web_shell: true,
    local_groups: [{ gid: 111, group: 'Group A' }, { gid: 222, group: 'Group B' }],
    ds_groups: [],
    roles: [Role.Readonly],
  } as Privilege;

  const createComponent = createComponentFactory({
    component: PrivilegeFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('group.query', [
          { group: 'Group A', gid: 111 },
          { group: 'Group B', gid: 222 },
        ] as Group[]),
        mockCall('privilege.create'),
        mockCall('privilege.update'),
        mockCall('privilege.roles', [
          { name: Role.FullAdmin, title: 'Full Admin' },
          { name: Role.SharingManager, title: 'Sharing Manager' },
          { name: Role.Readonly, title: 'Readonly' },
        ] as PrivilegeRole[]),
      ]),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a privilege', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new privilege',
        Roles: 'Sharing Manager',
        'Web Shell Access': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('privilege.create', [{
        ds_groups:  [],
        local_groups: [],
        name: 'new privilege',
        roles:  [Role.SharingManager],
        web_shell: true,
      }]);
    });
  });

  describe('editing a privilege', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: fakeDataPrivilege },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('shows current privilege values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Name: 'privilege',
        'Web Shell Access': true,
        'Local Groups': ['Group A', 'Group B'],
        'DS Groups': [],
        'Roles': ['Readonly'],
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated privilege',
        Roles: ['Full Admin', 'Readonly'],
        'Web Shell Access': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('privilege.update', [10, {
        ds_groups:  [],
        local_groups: [111, 222],
        name: 'updated privilege',
        roles:  [Role.FullAdmin, Role.Readonly],
        web_shell: false,
      }]);
    });
  });
});
