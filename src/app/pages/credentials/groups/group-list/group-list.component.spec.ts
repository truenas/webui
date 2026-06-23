import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonComponent, TnButtonHarness, TnSidePanelComponent, TnTableHarness } from '@truenas/ui-components';
import { MockComponent, MockInstance } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { GroupDetailsRowComponent } from 'app/pages/credentials/groups/group-details-row/group-details-row.component';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';
import { GroupListComponent } from 'app/pages/credentials/groups/group-list/group-list.component';
import { groupsInitialState, GroupsState } from 'app/pages/credentials/groups/store/group.reducer';
import { selectGroups, selectGroupState, selectGroupsTotal } from 'app/pages/credentials/groups/store/group.selectors';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const fakeGroupDataSource: Group[] = [{
  id: 1,
  group: 'mock',
  gid: 1000,
  builtin: true,
  sudo_commands: [] as string[],
  sudo_commands_nopasswd: [] as string[],
  roles: [] as Role[],
  smb: true,
  users: [1],
}, {
  id: 2,
  group: 'fake',
  gid: 1001,
  builtin: true,
  sudo_commands: ['ls'],
  sudo_commands_nopasswd: [],
  roles: [Role.FullAdmin],
  smb: true,
  users: [2],
}] as Group[];

describe('GroupListComponent', () => {
  MockInstance.scope();

  let spectator: Spectator<GroupListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<GroupsState>;

  const createComponent = createComponentFactory({
    component: GroupListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      TnButtonComponent,
    ],
    declarations: [
      MockComponent(GroupDetailsRowComponent),
    ],
    // GroupFormComponent imports tn-* form controls whose signal view-queries crash when
    // ng-mocks deep-mocks them; swap the real standalone import for a shallow mock instead.
    overrideComponents: [
      [GroupListComponent, {
        remove: { imports: [GroupFormComponent] },
        add: { imports: [MockComponent(GroupFormComponent)] },
      }],
    ],
    providers: [
      mockAuth(),
      mockProvider(ApiService),
      mockProvider(DialogService),
      mockProvider(UnsavedChangesService),
      provideMockStore({
        selectors: [
          {
            selector: selectGroupState,
            value: groupsInitialState,
          },
          {
            selector: selectGroups,
            value: [],
          },
          {
            selector: selectGroupsTotal,
            value: 0,
          },
          {
            selector: selectPreferences,
            value: {
              hideBuiltinGroups: false,
            } as Preferences,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('should show table rows', async () => {
    store$.overrideSelector(selectPreferences, { hideBuiltinGroups: true } as Preferences);
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(2);

    expect(await table.getCellText(0, 'group')).toBe('mock');
    expect(await table.getCellText(0, 'gid')).toBe('1000');
    expect(await table.getCellText(0, 'builtin')).toBe('Yes');
    expect(await table.getCellText(0, 'sudo')).toBe('No');
    expect(await table.getCellText(0, 'smb')).toBe('Yes');
    expect(await table.getCellText(0, 'roles')).toBe('N/A');

    expect(await table.getCellText(1, 'group')).toBe('fake');
    expect(await table.getCellText(1, 'sudo')).toBe('Yes');
    expect(await table.getCellText(1, 'roles')).toBe('Full Admin');
  });

  it('expands and collapses a row to reveal its details when the row is clicked', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);

    await table.clickRow(0);
    expect(await table.isRowExpanded(0)).toBe(true);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(1);

    await table.clickRow(0);
    expect(await table.isRowExpanded(0)).toBe(false);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(0);
  });

  it('keeps only one row expanded at a time', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);

    await table.clickRow(0);
    expect(await table.isRowExpanded(0)).toBe(true);

    await table.clickRow(1);
    expect(await table.isRowExpanded(1)).toBe(true);
    expect(await table.isRowExpanded(0)).toBe(false);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(1);
  });

  it('reflects the default ascending GID sort in the column header on first paint', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(TnTableHarness);

    expect(await table.getSortDirection('gid')).toBe('ascending');
  });

  it('opens the form side panel for adding when Add is clicked', async () => {
    // Stub the host-facing members the panel's Save action reads on the mocked form.
    MockInstance(GroupFormComponent, (instance) => {
      Object.assign(instance, { requiredRoles: [Role.AccountWrite], canSubmit: signal(false) });
    });
    const localSpectator = createComponent();
    const localLoader = TestbedHarnessEnvironment.loader(localSpectator.fixture);
    expect(localSpectator.query(GroupFormComponent)).toBeNull();

    const addButton = await localLoader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    localSpectator.detectChanges();

    expect(localSpectator.query(TnSidePanelComponent).open()).toBe(true);
    expect(localSpectator.query(GroupFormComponent)).toBeTruthy();
  });
});
