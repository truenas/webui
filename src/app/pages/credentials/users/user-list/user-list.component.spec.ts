import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { usersInitialState, UsersState } from 'app/pages/credentials/users/store/user.reducer';
import { selectUsers, selectUserState, selectUsersTotal } from 'app/pages/credentials/users/store/user.selectors';
import { UserDetailsRowComponent } from 'app/pages/credentials/users/user-details-row/user-details-row.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { UserListComponent } from './user-list.component';

const fakeUserDataSource: User[] = [
  {
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
    roles: [Role.FullAdmin, Role.HasAllowList],
  },
  {
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
    group: {
      id: 101,
      bsdgrp_gid: 1004,
      bsdgrp_group: 'test',
    },
    groups: [
      94,
    ],
    roles: [] as Role[],
  } as User,
] as User[];

describe('UserListComponent', () => {
  let spectator: Spectator<UserListComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<UsersState>;

  const createComponent = createComponentFactory({
    component: UserListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      IxTableDetailsRowDirective,
    ],
    declarations: [
      MockComponent(UserDetailsRowComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(ApiService),
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

    const expectedRows = [
      ['Username', 'UID', 'Builtin', 'Full Name', 'Roles'],
      ['root', '0', 'Yes', 'root', 'Full Admin, Has Allow List'],
      ['test', '1004', 'No', 'test', 'N/A'],
    ];

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('should expand and collapse only one row when clicked on it', async () => {
    store$.overrideSelector(selectUsers, fakeUserDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTableHarness);
    await table.clickRow(0);
    await table.clickRow(1);
    expect(spectator.queryAll(UserDetailsRowComponent)).toHaveLength(1);

    await table.clickRow(1);
    expect(spectator.queryAll(UserDetailsRowComponent)).toHaveLength(0);
  });

  it('should expand and collapse only one row on toggle click', async () => {
    store$.overrideSelector(selectUsers, fakeUserDataSource);
    store$.refreshState();

    const table = await loader.getHarness(IxTableHarness);
    await table.expandRow(0);
    await table.expandRow(1);
    expect(spectator.queryAll(UserDetailsRowComponent)).toHaveLength(1);

    await table.expandRow(1);
    expect(spectator.queryAll(UserDetailsRowComponent)).toHaveLength(0);
  });
});
