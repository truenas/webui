import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockModule } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { groupsInitialState, GroupsState } from 'app/pages/account/groups/store/group.reducer';
import { selectGroups, selectGroupState, selectGroupsTotal } from 'app/pages/account/groups/store/group.selectors';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const fakeGroupDataSource: Group[] = [{
  id: 1,
  group: 'mock',
  gid: 1000,
  builtin: true,
  sudo_commands: [],
  sudo_commands_nopasswd: [],
  roles: [],
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
  let spectator: Spectator<GroupListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<GroupsState>;

  const createComponent = createComponentFactory({
    component: GroupListComponent,
    imports: [
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    declarations: [
      MockComponent(GroupDetailsRowComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(WebSocketService),
      mockProvider(DialogService),
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

    const expectedRows = [
      ['Group', 'GID', 'Builtin', 'Allows sudo commands', 'Samba Authentication', 'Roles'],
      ['mock', '1000', 'Yes', 'Yes', 'Yes', 'N/A'],
      ['fake', '1001', 'Yes', 'Yes', 'Yes', 'Full Admin'],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should expand and collapse only one row when clicked on it', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTable2Harness);
    await table.clickRow(0);
    await table.clickRow(1);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(1);

    await table.clickRow(1);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(0);
  });

  it('should expand and collapse only one row on toggle click', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTable2Harness);
    await table.clickToggle(0);
    await table.clickToggle(1);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(1);

    await table.clickToggle(1);
    expect(spectator.queryAll(GroupDetailsRowComponent)).toHaveLength(0);
  });
});
