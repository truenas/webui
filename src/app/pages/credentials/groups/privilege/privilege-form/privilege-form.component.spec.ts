import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeRole } from 'app/interfaces/privilege.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/groups/privilege/privilege-form/privilege-form.component';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

/**
 * Type guard to check if a filter is a 'group in' filter.
 */
function isGroupInFilter(filter: unknown): filter is ['group', 'in', string[]] {
  return Array.isArray(filter)
    && filter.length === 3
    && filter[0] === 'group'
    && filter[1] === 'in'
    && Array.isArray(filter[2]);
}

/**
 * Type guard to check if a filter is a 'local' filter.
 */
function isLocalFilter(filter: unknown): filter is ['local', '=', boolean] {
  return Array.isArray(filter)
    && filter.length === 3
    && filter[0] === 'local'
    && filter[1] === '='
    && typeof filter[2] === 'boolean';
}

describe('PrivilegeFormComponent', () => {
  let spectator: Spectator<PrivilegeFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  // Test data - all available groups
  const testGroups: Group[] = [
    { group: 'Group A', gid: 111 } as Group,
    { group: 'Group B', gid: 222 } as Group,
  ];

  const fakeDataPrivilege = {
    id: 10,
    name: 'privilege',
    web_shell: true,
    local_groups: [
      { gid: 111, group: 'Group A' },
      { gid: 222, group: 'Group B' },
    ],
    ds_groups: [] as Group[],
    roles: [Role.ReadonlyAdmin],
  } as Privilege;

  const createComponent = createComponentFactory({
    component: PrivilegeFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('group.query', (params) => {
          // Handle all group.query calls - return groups based on filters
          const filters = params?.[0] || [];
          const groupInFilter = filters.find(isGroupInFilter);
          const localFilter = filters.find(isLocalFilter);

          // If filtering by group names, return only those groups
          if (groupInFilter) {
            const requestedNames = groupInFilter[2];
            return testGroups.filter((group) => requestedNames.includes(group.group));
          }

          // If filtering by local=false (DS groups), return empty
          if (localFilter?.[2] === false) {
            return [] as Group[];
          }

          // Default: return all local groups
          return testGroups;
        }),
        mockCall('privilege.create'),
        mockCall('privilege.update'),
        mockCall('privilege.roles', [
          { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
          { name: Role.SharingAdmin, title: Role.SharingAdmin, builtin: false },
          { name: Role.ReadonlyAdmin, title: Role.ReadonlyAdmin, builtin: false },
          { name: Role.SharingSmbRead, title: Role.SharingSmbRead, builtin: false },
          { name: Role.SharingSmbWrite, title: Role.SharingSmbWrite, builtin: false },
        ] as PrivilegeRole[]),
        mockCall('system.general.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: true,
          },
          {
            selector: selectGeneralConfig,
            value: {
              ds_auth: false,
            },
          },
        ],
      }),
      mockAuth(),
    ],
  });

  describe('adding a privilege', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
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

      expect(api.call).toHaveBeenCalledWith('privilege.create', [{
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
          mockProvider(SlideInRef, { ...slideInRef, getData: () => fakeDataPrivilege }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current privilege values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Name: 'privilege',
        'Web Shell Access': true,
        'Local Groups': ['Group A', 'Group B'],
        'Directory Services Groups': [],
        Roles: ['Readonly Admin'],
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', fakeAsync(async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'updated privilege',
        Roles: ['Full Admin', 'Readonly Admin'],
        'Web Shell Access': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Flush all pending async operations
      flush();

      expect(api.call).toHaveBeenCalledWith('privilege.update', [10, {
        ds_groups: [],
        local_groups: [111, 222],
        name: 'updated privilege',
        roles: [Role.FullAdmin, Role.ReadonlyAdmin],
        web_shell: false,
      }]);
    }));
  });

  describe('editing a build-in privilege', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ ...fakeDataPrivilege, builtin_name: 'ADMIN' }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', fakeAsync(async () => {
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

      // Flush all pending async operations
      flush();

      expect(api.call).toHaveBeenCalledWith('privilege.update', [10, {
        ds_groups: [],
        local_groups: [111, 222],
        web_shell: false,
      }]);
    }));
  });

  describe('group validation', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('prevents saving when local group does not exist and shows error', fakeAsync(() => {
      // Manually set form value to bypass chips validation
      const form = (spectator.component as unknown as { form: typeof spectator.component['form'] }).form;
      form.patchValue({
        name: 'test privilege',
        local_groups: ['Group A', 'NonExistentGroup'],
        roles: [Role.FullAdmin],
      });

      spectator.component.onSubmit();

      flush();

      // Validation error should prevent privilege.create from being called
      const privilegeCreateCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'privilege.create',
      );
      expect(privilegeCreateCalls).toHaveLength(0);
    }));

    it('prevents saving when DS group does not exist and shows error', fakeAsync(() => {
      // Manually set form value to bypass chips validation
      const form = (spectator.component as unknown as { form: typeof spectator.component['form'] }).form;
      form.patchValue({
        name: 'test privilege',
        ds_groups: ['NonExistentDSGroup'],
        roles: [Role.FullAdmin],
      });

      spectator.component.onSubmit();

      flush();

      // Validation error should prevent privilege.create from being called
      const privilegeCreateCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'privilege.create',
      );
      expect(privilegeCreateCalls).toHaveLength(0);
    }));
  });
});
