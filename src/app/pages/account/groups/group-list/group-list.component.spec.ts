import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockModule } from 'ng-mocks';
import { CoreComponents } from 'app/core/core-components.module';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupsState } from 'app/pages/account/groups/store/group.reducer';
import { selectGroupState, selectGroups, selectGroupsTotal } from 'app/pages/account/groups/store/group.selectors';
import { usersInitialState } from 'app/pages/account/users/store/user.reducer';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

const fakeGroupDataSource: Group[] = [{
  group: 'mock',
  gid: 1000,
  builtin: true,
  sudo_commands: [],
  sudo_commands_nopasswd: [],
  roles: [],
  smb: true,
  users: [1],
}, {
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
      CoreComponents,
      IxTableModule,
      MockModule(LayoutModule),
    ],
    declarations: [
      GroupDetailsRowComponent,
    ],
    providers: [
      mockProvider(WebSocketService),
      mockProvider(DialogService),
      provideMockStore({
        selectors: [
          {
            selector: selectGroupState,
            value: usersInitialState,
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

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Group', 'GID', 'Builtin', 'Allows sudo commands', 'Samba Authentication', 'Roles', ''],
      ['mock', '1000', 'Yes', 'No', 'Yes', 'N/A', ''],
      ['fake', '1001', 'Yes', 'Yes', 'Yes', 'Full Admin', ''],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store$.overrideSelector(selectGroups, []);
    store$.refreshState();

    spectator.detectChanges();

    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should have error message when can not retrieve response', async () => {
    store$.overrideSelector(selectGroupState, {
      error: 'Groups could not be loaded',
    } as GroupsState);
    store$.refreshState();
    store$.select(selectGroups).subscribe((snapshots) => {
      expect(snapshots).toEqual([]);
    });

    spectator.detectChanges();

    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('Can not retrieve response');
  });

  it('should expand only one row on click', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const [firstExpandButton, secondExpandButton] = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[ixTest="toggle-row"]' }));
    await firstExpandButton.click();
    await secondExpandButton.click();

    expect(spectator.queryAll('.expanded')).toHaveLength(1);
  });
});
