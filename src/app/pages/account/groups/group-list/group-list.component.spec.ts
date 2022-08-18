import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { GroupDetailsRowComponent } from 'app/pages/account/groups/group-details-row/group-details-row.component';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupsState } from 'app/pages/account/groups/store/group.reducer';
import { selectGroupState, selectGroups, selectGroupsTotal } from 'app/pages/account/groups/store/group.selectors';
import { usersInitialState } from 'app/pages/account/users/store/user.reducer';
import { DialogService, WebSocketService } from 'app/services';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

export const fakeGroupDataSource: Group[] = [{
  group: 'mock',
  gid: 1000,
  builtin: true,
  sudo: true,
  smb: true,
  users: [1],
}, {
  group: 'fake',
  gid: 1001,
  builtin: true,
  sudo: true,
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
      EntityModule,
      IxTableModule,
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
      ['Group', 'GID', 'Builtin', 'Permit Sudo', 'Samba Authentication', ''],
      ['mock', '1000', 'true', 'true', 'true', 'expand_more'],
      ['fake', '1001', 'true', 'true', 'true', 'expand_more'],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store$.overrideSelector(selectGroups, []);
    store$.refreshState();

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['No Groups']]);
  });

  it('should have error message when can not retrieve response', async () => {
    store$.overrideSelector(selectGroupState, {
      error: 'Groups could not be loaded',
    } as GroupsState);
    store$.refreshState();
    store$.select(selectGroups).subscribe((snapshots) => {
      expect(snapshots).toEqual([]);
    });

    const table = await loader.getHarness(IxTableHarness);
    const text = await table.getCellTextByIndex();

    expect(text).toEqual([['Can not retrieve response']]);
  });

  it('should expand only one row on click', async () => {
    store$.overrideSelector(selectGroups, fakeGroupDataSource);
    store$.refreshState();

    const [firstExpandButton, secondExpandButton] = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'expand_more' }));
    await firstExpandButton.click();
    await secondExpandButton.click();

    expect(spectator.queryAll('.expanded')).toHaveLength(1);
  });
});
