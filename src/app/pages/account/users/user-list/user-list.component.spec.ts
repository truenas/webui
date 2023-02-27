import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CoreComponents } from 'app/core/core-components.module';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxEmptyRowHarness } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component.harness';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { usersInitialState, UsersState } from 'app/pages/account/users/store/user.reducer';
import { selectUsers, selectUserState, selectUsersTotal } from 'app/pages/account/users/store/user.selectors';
import { UserDetailsRowComponent } from 'app/pages/account/users/user-details-row/user-details-row.component';
import { DialogService, WebSocketService } from 'app/services';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { UserListComponent } from './user-list.component';

const fakeUserDataSource: User[] = [{
  id: 1,
  uid: 0,
  username: 'root',
  smbhash: '',
  home: '/root',
  shell: '/usr/bin/zsh',
  full_name: 'root',
  builtin: true,
  smb: false,
  password_disabled: false,
  locked: false,
  sudo_commands: [],
  sudo_commands_nopasswd: [],
  email: 'root@root.root',
  group: {
    id: 41,
    bsdgrp_gid: 0,
    bsdgrp_group: 'root',
  },
  groups: [],
}, {
  id: 69,
  uid: 1004,
  username: 'test',
  home: '/home/test',
  shell: '/usr/bin/bash',
  full_name: 'test',
  builtin: false,
  smb: true,
  password_disabled: false,
  locked: false,
  sudo_commands: [],
  sudo_commands_nopasswd: [],
  email: null,
  group: {
    id: 101,
    bsdgrp_gid: 1004,
    bsdgrp_group: 'test',
  },
  groups: [
    94,
  ],
}] as User[];

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<UsersState>;

  const createComponent = createComponentFactory({
    component: UserListComponent,
    imports: [
      EntityModule,
      IxTableModule,
      CoreComponents,
    ],
    declarations: [
      UserDetailsRowComponent,
    ],
    providers: [
      mockProvider(WebSocketService),
      mockProvider(DialogService),
      provideMockStore({
        selectors: [
          {
            selector: selectUserState,
            value: usersInitialState,
          },
          {
            selector: selectUsers,
            value: [],
          },
          {
            selector: selectUsersTotal,
            value: 0,
          },
          {
            selector: selectPreferences,
            value: {
              hideBuiltinUsers: false,
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
    store$.overrideSelector(selectPreferences, { hideBuiltinUsers: true } as Preferences);
    store$.overrideSelector(selectUsers, fakeUserDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Username', 'UID', 'Builtin', 'Full Name', ''],
      ['root', '0', 'Yes', 'root', ''],
      ['test', '1004', 'No', 'test', ''],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should have empty message when loaded and datasource is empty', async () => {
    store$.overrideSelector(selectUsers, []);
    store$.refreshState();

    spectator.detectChanges();

    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('No records have been added yet');
  });

  it('should have error message when can not retrieve response', async () => {
    store$.overrideSelector(selectUserState, {
      error: 'Users could not be loaded',
    } as UsersState);
    store$.refreshState();
    store$.select(selectUsers).subscribe((snapshots) => {
      expect(snapshots).toEqual([]);
    });

    spectator.detectChanges();

    const emptyRow = await loader.getHarness(IxEmptyRowHarness);
    const emptyTitle = await emptyRow.getTitleText();
    expect(emptyTitle).toBe('Can not retrieve response');
  });

  it('should expand only one row on click', async () => {
    store$.overrideSelector(selectUsers, fakeUserDataSource);
    store$.refreshState();

    const [firstExpandButton, secondExpandButton] = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[ixTest="toggle-row"]' }));
    await firstExpandButton.click();
    await secondExpandButton.click();

    expect(spectator.queryAll('.expanded')).toHaveLength(1);
  });
});
