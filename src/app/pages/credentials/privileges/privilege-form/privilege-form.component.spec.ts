import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeRole } from 'app/interfaces/privilege.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxGroupChipsHarness } from 'app/modules/forms/ix-forms/testing/user-group-picker.harnesses';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/privileges/privilege-form/privilege-form.component';
import { UserService } from 'app/services/user.service';
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
      ...ixFormTestingProviders(),
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
        mockCall('directoryservices.status', {
          status: DirectoryServiceStatus.Disabled,
        } as DirectoryServicesStatus),
      ]),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([])),
        getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
        getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
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
      const roles = await loader.getHarness(TnSelectHarness);
      await roles.open();
      const options = await roles.getOptions();
      expect(options).toEqual([
        'Full Admin',
        'Readonly Admin',
        'Sharing Admin',
        'Sharing SMB Read',
        'Sharing SMB Write',
      ]);
    });

    it('sends a create payload to websocket and closes the panel when submitted', async () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      const name = await loader.getHarness(TnInputHarness);
      await name.setValue('new privilege');

      const roles = await loader.getHarness(TnSelectHarness);
      await roles.selectOption('Sharing Admin');
      await roles.close();

      const webShell = await loader.getHarness(TnCheckboxHarness);
      await webShell.check();

      spectator.component.submit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('privilege.create', [{
        ds_groups: [],
        local_groups: [],
        name: 'new privilege',
        roles: [Role.SharingAdmin],
        web_shell: true,
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });

    it('selects every role when the select-all row is toggled', async () => {
      const name = await loader.getHarness(TnInputHarness);
      await name.setValue('new privilege');

      const roles = await loader.getHarness(TnSelectHarness);
      await roles.toggleSelectAll();
      await roles.close();

      spectator.component.submit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const createCall = (api.call as jest.Mock).mock.calls.find((call) => call[0] === 'privilege.create');
      expect(createCall[1][0].roles).toEqual(expect.arrayContaining([
        Role.FullAdmin,
        Role.SharingAdmin,
        Role.ReadonlyAdmin,
        Role.SharingSmbRead,
        Role.SharingSmbWrite,
      ]));
      expect(createCall[1][0].roles).toHaveLength(5);
    });
  });

  describe('editing a privilege', () => {
    beforeEach(() => {
      spectator = createComponent({ detectChanges: false });
      spectator.setInput('editPrivilege', fakeDataPrivilege);
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current privilege values when form is being edited', async () => {
      const name = await loader.getHarness(TnInputHarness);
      expect(await name.getValue()).toBe('privilege');

      const webShell = await loader.getHarness(TnCheckboxHarness);
      expect(await webShell.isChecked()).toBe(true);

      const localGroups = await loader.getHarness(TnChipInputHarness);
      expect(await localGroups.getChips()).toEqual(['Group A', 'Group B']);

      const roles = await loader.getHarness(TnSelectHarness);
      expect(await roles.getDisplayText()).toBe('Readonly Admin');
    });

    it('sends an update payload to websocket and closes the panel when submitted', async () => {
      const name = await loader.getHarness(TnInputHarness);
      await name.setValue('updated privilege');

      // Readonly Admin is already selected (from the edited record); add Full Admin.
      const roles = await loader.getHarness(TnSelectHarness);
      await roles.selectOption('Full Admin');
      await roles.close();

      const webShell = await loader.getHarness(TnCheckboxHarness);
      await webShell.uncheck();

      spectator.component.submit();

      // Wait for all pending async operations
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const updateCall = (api.call as jest.Mock).mock.calls.find((call) => call[0] === 'privilege.update');
      expect(updateCall[1][0]).toBe(10);
      expect(updateCall[1][1]).toMatchObject({
        ds_groups: [],
        local_groups: [111, 222],
        name: 'updated privilege',
        web_shell: false,
      });
      expect(updateCall[1][1].roles).toEqual(expect.arrayContaining([Role.FullAdmin, Role.ReadonlyAdmin]));
      expect(updateCall[1][1].roles).toHaveLength(2);
    });
  });

  describe('editing a build-in privilege', () => {
    beforeEach(() => {
      spectator = createComponent({ detectChanges: false });
      spectator.setInput('editPrivilege', { ...fakeDataPrivilege, builtin_name: 'ADMIN' } as Privilege);
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an update payload to websocket and closes the panel when submitted', async () => {
      const name = await loader.getHarness(TnInputHarness);
      expect(await name.isDisabled()).toBe(true);

      const roles = await loader.getHarness(TnSelectHarness);
      expect(await roles.isDisabled()).toBe(true);

      const localGroups = await loader.getHarness(TnChipInputHarness);
      expect(await localGroups.isDisabled()).toBe(false);

      const webShell = await loader.getHarness(TnCheckboxHarness);
      expect(await webShell.isDisabled()).toBe(false);
      await webShell.uncheck();

      spectator.component.submit();

      // Wait for all pending async operations
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('privilege.update', [10, {
        ds_groups: [],
        local_groups: [111, 222],
        web_shell: false,
      }]);
    });
  });

  describe('group validation', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('prevents saving when local group does not exist and shows error', async () => {
      // Note: Cannot use IxFormHarness here because this tests an edge case where
      // a group was valid when entered but got deleted before submission.
      // The chips provider would prevent entering invalid groups in normal UI flow.
      // Accessing protected form property via bracket notation for testing
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        name: 'test privilege',
        local_groups: ['Group A', 'NonExistentGroup'],
        roles: [Role.FullAdmin],
      });

      spectator.component.submit();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Validation error should prevent privilege.create from being called
      const privilegeCreateCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'privilege.create',
      );
      expect(privilegeCreateCalls).toHaveLength(0);
    });

    it('prevents saving when DS group does not exist and shows error', async () => {
      // Note: Cannot use IxFormHarness here because this tests an edge case where
      // a group was valid when entered but got deleted before submission.
      // The chips provider would prevent entering invalid groups in normal UI flow.
      //
      // Submission resolves DS groups via api.call('group.query') in dsGroupsUids$;
      // the factory group.query mock returns no matches for the local=false (DS) filter,
      // so 'NonExistentDSGroup' is reported missing and privilege.create is skipped.

      // Accessing protected form property via bracket notation for testing
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        name: 'test privilege',
        ds_groups: ['NonExistentDSGroup'],
        roles: [Role.FullAdmin],
      });

      spectator.component.submit();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Validation error should prevent privilege.create from being called
      const privilegeCreateCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'privilege.create',
      );
      expect(privilegeCreateCalls).toHaveLength(0);
    });
  });

  // The query shaping these used to assert — the server-side filter, the limit, the
  // ordering — moved into UserDirectoryService, which is where it is now covered
  // (user-directory.service.spec.ts). What is left here is the part this form
  // still owns: how it narrows the list.
  describe('local groups field', () => {
    beforeEach(() => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('asks the directory for local groups, built-ins included', async () => {
      const localGroups = await loader.getHarness(
        IxGroupChipsHarness.with({ selector: '[formControlName="local_groups"]' }),
      );
      await localGroups.typeText('test');

      // A privilege can legitimately be granted to a built-in local group, so the
      // field asks for `local` without also asking for `immutable = false`.
      expect(spectator.inject(UserService).groupQueryDsCache).toHaveBeenCalledWith(
        expect.any(String),
        false,
        0,
        [['local', '=', true]],
      );
    });
  });

  describe('directory services authentication button', () => {
    it('should call directoryservices.status when DS groups are added and DS is enabled', async () => {
      spectator = createComponent({
        providers: [
          ...ixFormTestingProviders(),
          mockApi([
            mockCall('group.query', testGroups),
            mockCall('privilege.roles', [
              { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
            ] as PrivilegeRole[]),
            mockCall('directoryservices.status', {
              type: 'ACTIVEDIRECTORY',
              status: DirectoryServiceStatus.Healthy,
            } as DirectoryServicesStatus),
          ]),
          mockProvider(UserService, {
            groupQueryDsCache: jest.fn(() => of([])),
            getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
            getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
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

      api = spectator.inject(ApiService);

      // Wait for ngOnInit to complete
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should have checked DS status
      expect(api.call).toHaveBeenCalledWith('directoryservices.status');
    });

    it('should NOT show button when DS groups are added but Directory Services are disabled', async () => {
      spectator = createComponent({
        providers: [
          ...ixFormTestingProviders(),
          mockApi([
            mockCall('group.query', testGroups),
            mockCall('privilege.roles', [
              { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
            ] as PrivilegeRole[]),
            mockCall('directoryservices.status', {
              status: DirectoryServiceStatus.Disabled,
            } as DirectoryServicesStatus),
          ]),
          mockProvider(UserService, {
            groupQueryDsCache: jest.fn(() => of([])),
            getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
            getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
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

      api = spectator.inject(ApiService);

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(api.call).toHaveBeenCalledWith('directoryservices.status');

      // Button should NOT be visible since DS is disabled
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Enable DS Authentication' }));
      expect(buttons).toHaveLength(0);
    });

    it('should NOT show button when ds_auth is already enabled', async () => {
      spectator = createComponent({
        providers: [
          ...ixFormTestingProviders(),
          mockApi([
            mockCall('group.query', testGroups),
            mockCall('privilege.roles', [
              { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
            ] as PrivilegeRole[]),
            mockCall('directoryservices.status', {
              type: 'ACTIVEDIRECTORY',
              status: DirectoryServiceStatus.Healthy,
            } as DirectoryServicesStatus),
          ]),
          mockProvider(UserService, {
            groupQueryDsCache: jest.fn(() => of([])),
            getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
            getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
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
                  ds_auth: true, // Already enabled
                },
              },
            ],
          }),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);

      // Wait for initial config load
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should not show button since ds_auth is already enabled
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Enable DS Authentication' }));
      expect(buttons).toHaveLength(0);
    });

    it('should NOT show button in non-enterprise mode', async () => {
      spectator = createComponent({
        providers: [
          ...ixFormTestingProviders(),
          mockApi([
            mockCall('group.query', testGroups),
            mockCall('privilege.roles', [
              { name: Role.FullAdmin, title: Role.FullAdmin, builtin: false },
            ] as PrivilegeRole[]),
            mockCall('directoryservices.status', {
              type: 'ACTIVEDIRECTORY',
              status: DirectoryServiceStatus.Healthy,
            } as DirectoryServicesStatus),
          ]),
          mockProvider(UserService, {
            groupQueryDsCache: jest.fn(() => of([])),
            getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
            getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
          }),
          provideMockStore({
            selectors: [
              {
                selector: selectIsEnterprise,
                value: false, // Not enterprise
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

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should not show button in non-enterprise mode
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Enable DS Authentication' }));
      expect(buttons).toHaveLength(0);
    });

    it('should show button and enable ds_auth when clicked', async () => {
      spectator = createComponent({
        detectChanges: false,
        providers: [
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
          mockProvider(UserService, {
            groupQueryDsCache: jest.fn(() => of([])),
            getGroupByName: jest.fn(() => of({ gr_gid: 1000, gr_mem: [], gr_name: 'test' })),
            getGroupByNameCached: jest.fn((groupName: string) => of({ gr_gid: 1000, gr_mem: [], gr_name: groupName })),
          }),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);

      // Report DS as active (with a type) before ngOnInit reads the status, so the
      // enable button becomes available — drives visibility through the mocked call
      // rather than poking the component's private state. `detectChanges: false`
      // defers ngOnInit until after this override is in place.
      spectator.inject(MockApiService).mockCall('directoryservices.status', {
        type: 'ACTIVEDIRECTORY',
        status: DirectoryServiceStatus.Healthy,
      } as DirectoryServicesStatus);

      // Run ngOnInit now that the status is mocked
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Button should be visible (getHarness throws if absent)
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const button = await loader.getHarness(TnButtonHarness.with({ label: 'Enable DS Authentication' }));

      // Click the button
      await button.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should have called the API to enable ds_auth
      expect(api.call).toHaveBeenCalledWith('system.general.update', [{ ds_auth: true }]);

      // Button should be hidden after enabling
      spectator.detectChanges();
      const buttonsAfter = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Enable DS Authentication' }));
      expect(buttonsAfter).toHaveLength(0);
    });
  });
});
