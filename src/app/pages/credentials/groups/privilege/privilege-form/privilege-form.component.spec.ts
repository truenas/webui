import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeRole } from 'app/interfaces/privilege.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { PrivilegeFormComponent } from 'app/pages/credentials/groups/privilege/privilege-form/privilege-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('PrivilegeFormComponent', () => {
  let spectator: Spectator<PrivilegeFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const fakeDataPrivilege = {
    id: 10,
    name: 'privilege',
    web_shell: true,
    local_groups: [
      { gid: 111, group: 'Group A' },
      { gid: 222, group: 'Group B' },
      { gid: 333, group: null },
    ],
    ds_groups: [],
    roles: [Role.ReadonlyAdmin],
    builtin_name: null,
  } as Privilege;

  const createComponent = createComponentFactory({
    component: PrivilegeFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('group.query', [
          { group: 'Group A', gid: 111 },
          { group: 'Group B', gid: 222 },
        ] as Group[]),
        mockCall('privilege.create'),
        mockCall('privilege.update'),
        mockCall('privilege.roles', [
          { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
          { name: Role.SharingAdmin, title: Role.SharingAdmin, builtin: false },
          { name: Role.ReadonlyAdmin, title: Role.ReadonlyAdmin, builtin: false },
          { name: Role.SharingSmbRead, title: Role.SharingSmbRead, builtin: false },
          { name: Role.SharingSmbWrite, title: Role.SharingSmbWrite, builtin: false },
        ] as PrivilegeRole[]),
      ]),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a privilege', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('shows roles sorted alphabetically with compound (non-builtin) roles on top', async () => {
      const roles = await loader.getHarness(IxSelectHarness.with({ label: 'Roles' }));
      const options = await roles.getOptionLabels();
      expect(options).toEqual([
        'Full Admin',
        'Readonly Admin',
        'Sharing Admin',
        'Sharing SMB Read',
        'Sharing SMB Write',
      ]);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new privilege',
        Roles: 'Sharing Admin',
        'Web Shell Access': true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('privilege.create', [{
        ds_groups: [],
        local_groups: [],
        name: 'new privilege',
        roles: [Role.SharingAdmin],
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
        'Local Groups': ['Group A', 'Group B', 'Missing group - 333'],
        'Directory Services Groups': [],
        Roles: ['Readonly Admin'],
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated privilege',
        Roles: ['Full Admin', 'Readonly Admin'],
        'Web Shell Access': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('privilege.update', [10, {
        ds_groups: [],
        local_groups: [111, 222],
        name: 'updated privilege',
        roles: [Role.FullAdmin, Role.ReadonlyAdmin],
        web_shell: false,
      }]);
    });
  });

  describe('editing a build-in privilege', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: { ...fakeDataPrivilege, builtin_name: 'ADMIN' } },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);

      expect(await form.getDisabledState()).toEqual({
        Name: true,
        Roles: true,
        'Directory Services Groups': false,
        'Local Groups': false,
        'Web Shell Access': false,
      });

      await form.fillForm({
        'Web Shell Access': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenLastCalledWith('privilege.update', [10, {
        ds_groups: [],
        local_groups: [111, 222],
        web_shell: false,
      }]);
    });
  });
});
