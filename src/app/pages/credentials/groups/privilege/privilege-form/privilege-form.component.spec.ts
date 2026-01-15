import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { lastValueFrom, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeRole } from 'app/interfaces/privilege.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { PrivilegeFormComponent } from 'app/pages/credentials/groups/privilege/privilege-form/privilege-form.component';
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
        mockCall('directoryservices.status', {
          status: DirectoryServiceStatus.Disabled,
        } as DirectoryServicesStatus),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([])),
        getGroupByName: jest.fn((groupName: string) => {
          // Return existing groups, error for non-existent ones
          const existingGroup = testGroups.find((group) => group.group === groupName);
          if (existingGroup) {
            return of(existingGroup);
          }
          return of(null);
        }),
        getUserByName: jest.fn(() => {
          // Mock user validation - all users are considered non-existent for testing
          return of(null);
        }),
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

      spectator.component.onSubmit();

      flush();

      // Validation error should prevent privilege.create from being called
      const privilegeCreateCalls = (api.call as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'privilege.create',
      );
      expect(privilegeCreateCalls).toHaveLength(0);
    }));

    it('prevents saving when DS group does not exist and shows error', fakeAsync(() => {
      // Note: Cannot use IxFormHarness here because this tests an edge case where
      // a group was valid when entered but got deleted before submission.
      // The chips provider would prevent entering invalid groups in normal UI flow.
      // Accessing protected form property via bracket notation for testing
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
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

  describe('group providers', () => {
    beforeEach(() => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
    });

    it('should call API with server-side prefix filter for local groups', async () => {
      const provider = spectator.component.localGroupsProvider;

      await lastValueFrom(provider('test'));

      expect(api.call).toHaveBeenCalledWith('group.query', [
        [['local', '=', true], ['group', '^', 'test']],
        { limit: 50, order_by: ['group'] },
      ]);
    });

    it('should apply client-side contains filtering for local groups', async () => {
      const provider = spectator.component.localGroupsProvider;

      // Mock API returns groups that start with 'gr' (server-side filter)
      (api.call as jest.Mock).mockReturnValue(of([
        { group: 'group-test' } as Group,
        { group: 'grtest' } as Group,
        { group: 'other-group' } as Group,
      ]));

      const result = await lastValueFrom(provider('test'));

      // Client-side filter keeps only groups that contain 'test'
      expect(result).toEqual(['group-test', 'grtest']);
    });

    it('should limit local group results to 50', async () => {
      const provider = spectator.component.localGroupsProvider;

      await lastValueFrom(provider(''));

      expect(api.call).toHaveBeenCalledWith('group.query', [
        [['local', '=', true]],
        { limit: 50, order_by: ['group'] },
      ]);
    });

    it('should order local groups by name', async () => {
      const provider = spectator.component.localGroupsProvider;

      await lastValueFrom(provider('test'));

      const callArgs = (api.call as jest.Mock).mock.calls.find(
        (call) => call[0] === 'group.query',
      );
      expect(callArgs[1][1]).toEqual({ limit: 50, order_by: ['group'] });
    });

    it('uses ix-group-chips component for DS groups with automatic validation', () => {
      const groupChipsComponent = spectator.query('ix-group-chips[formControlName="ds_groups"]');
      expect(groupChipsComponent).toExist();
    });

    it('dS groups field uses UserService for group queries', () => {
      const userService = spectator.inject(UserService);
      // ix-group-chips component automatically uses UserService.groupQueryDsCache
      expect(userService).toBeTruthy();
    });

    it('should handle empty query for local groups', async () => {
      const provider = spectator.component.localGroupsProvider;

      (api.call as jest.Mock).mockReturnValue(of([
        { group: 'group1' } as Group,
        { group: 'group2' } as Group,
      ]));

      const result = await lastValueFrom(provider(''));

      // Empty query returns all groups up to limit
      expect(result).toEqual(['group1', 'group2']);
      expect(api.call).toHaveBeenCalledWith('group.query', [
        [['local', '=', true]],
        { limit: 50, order_by: ['group'] },
      ]);
    });

    it('should handle whitespace-only query', async () => {
      const provider = spectator.component.localGroupsProvider;

      (api.call as jest.Mock).mockReturnValue(of([
        { group: 'group1' } as Group,
      ]));

      const result = await lastValueFrom(provider('   '));

      // Whitespace-only query is treated as empty
      expect(result).toEqual(['group1']);
      expect(api.call).toHaveBeenCalledWith('group.query', [
        [['local', '=', true]],
        { limit: 50, order_by: ['group'] },
      ]);
    });
  });

  describe('directory services authentication button', () => {
    it('should call directoryservices.status when DS groups are added and DS is enabled', fakeAsync(() => {
      spectator = createComponent({
        providers: [
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
            getGroupByName: jest.fn((groupName: string) => {
              // Return existing groups, error for non-existent ones
              const existingGroups = ['AD\\Domain Admins'];
              if (existingGroups.includes(groupName)) {
                return of({ group: groupName } as Group);
              }
              return throwError(() => new Error('Not found'));
            }),
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
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);

      // Wait for ngOnInit to complete
      flush();

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      flush();

      // Should have checked DS status
      expect(api.call).toHaveBeenCalledWith('directoryservices.status');
    }));

    it('should NOT show button when DS groups are added but Directory Services are disabled', fakeAsync(() => {
      spectator = createComponent({
        providers: [
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
            getGroupByName: jest.fn((groupName: string) => {
              // Return existing groups, error for non-existent ones
              const existingGroups = ['AD\\Domain Admins'];
              if (existingGroups.includes(groupName)) {
                return of({ group: groupName } as Group);
              }
              return throwError(() => new Error('Not found'));
            }),
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
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      flush();
      spectator.detectChanges();

      expect(api.call).toHaveBeenCalledWith('directoryservices.status');

      // Button should NOT be visible since DS is disabled
      const button = spectator.query('button[ixTest="enable-ds-auth"]');
      expect(button).toBeFalsy();
    }));

    it('should NOT show button when ds_auth is already enabled', fakeAsync(() => {
      spectator = createComponent({
        providers: [
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
            getGroupByName: jest.fn((groupName: string) => {
              // Return existing groups, error for non-existent ones
              const existingGroups = ['AD\\Domain Admins'];
              if (existingGroups.includes(groupName)) {
                return of({ group: groupName } as Group);
              }
              return throwError(() => new Error('Not found'));
            }),
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
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);

      // Wait for initial config load
      flush();

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      flush();
      spectator.detectChanges();

      // Should not show button since ds_auth is already enabled
      const button = spectator.query('button[ixTest="enable-ds-auth"]');
      expect(button).toBeFalsy();
    }));

    it('should NOT show button in non-enterprise mode', fakeAsync(() => {
      spectator = createComponent({
        providers: [
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
            getGroupByName: jest.fn((groupName: string) => {
              // Return existing groups, error for non-existent ones
              const existingGroups = ['AD\\Domain Admins'];
              if (existingGroups.includes(groupName)) {
                return of({ group: groupName } as Group);
              }
              return throwError(() => new Error('Not found'));
            }),
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
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      // Trigger DS groups being added
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['form'].patchValue({
        ds_groups: ['AD\\Domain Admins'],
      });

      flush();
      spectator.detectChanges();

      // Should not show button in non-enterprise mode
      const button = spectator.query('button[ixTest="enable-ds-auth"]');
      expect(button).toBeFalsy();
    }));

    it('should show button and enable ds_auth when clicked', fakeAsync(async () => {
      spectator = createComponent({
        providers: [
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
            getGroupByName: jest.fn((groupName: string) => {
              // Return existing groups, error for non-existent ones
              const existingGroups = ['AD\\Domain Admins'];
              if (existingGroups.includes(groupName)) {
                return of({ group: groupName } as Group);
              }
              return throwError(() => new Error('Not found'));
            }),
          }),
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      api = spectator.inject(ApiService);
      const localLoader = TestbedHarnessEnvironment.loader(spectator.fixture);

      // Wait for ngOnInit and directoryservices.status API call to complete
      flush();
      spectator.detectChanges();

      // Wait for the directoryservices.status subscription to process
      flush();
      spectator.detectChanges();

      // Manually set DS status to Healthy with type (factory mock doesn't include type)
      // This must be done BEFORE filling the form to trigger button visibility
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['dsStatus'].set({
        type: 'ACTIVEDIRECTORY',
        status: DirectoryServiceStatus.Healthy,
      } as DirectoryServicesStatus);

      // Use IxFormHarness to properly fill the form
      const form = await localLoader.getHarness(IxFormHarness);
      await form.fillForm({
        'Directory Services Groups': ['AD\\Domain Admins'],
      });

      // Wait for async group validation and button visibility update
      flush();
      spectator.detectChanges();

      // Button should be visible
      const button = spectator.query('button[ixTest="enable-ds-auth"]');
      expect(button).toBeTruthy();

      // Click the button
      spectator.click(button);
      flush();

      // Should have called the API to enable ds_auth
      expect(api.call).toHaveBeenCalledWith('system.general.update', [{ ds_auth: true }]);

      // Button should be hidden after enabling
      spectator.detectChanges();
      const buttonAfter = spectator.query('button[ixTest="enable-ds-auth"]');
      expect(buttonAfter).toBeFalsy();
    }));
  });
});
